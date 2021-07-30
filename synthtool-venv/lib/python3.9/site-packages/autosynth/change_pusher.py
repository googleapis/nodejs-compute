#!/usr/bin/env python3
# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import subprocess
import tempfile
import typing
import uuid
from abc import ABC, abstractmethod

from autosynth import git, github, executor
from autosynth.log import logger
import re


"""Text we include in the pull request body so the user can request autosynth
to automatically regenerate this pull request."""
REGENERATE_CHECKBOX_TEXT = "- [x] To automatically regenerate this PR, check this box."


class AbstractPullRequest(ABC):
    """Abstractly, manipulates an existing pull request."""

    @abstractmethod
    def add_labels(self, labels: typing.Sequence[str]) -> None:
        """Adds labels to an existing pull request."""
        pass


class AbstractChangePusher(ABC):
    """Abstractly, the thing that pushes changes to github."""

    @abstractmethod
    def push_changes(
        self, commit_count: int, branch: str, pr_title: str, synth_log: str = ""
    ) -> AbstractPullRequest:
        """Creates a pull request from commits in current working directory.

        Arguments:
            commit_count {int} -- How many commits are in this pull request?
            branch {str} -- The name of the local branch to push.
            pr_title {str} -- The title for the pull request.

        Keyword Arguments:
            synth_log {str} -- The full log of the call to synth. (default: {""})

        Returns:
            A pull request.
        """
        pass

    @abstractmethod
    def check_if_pr_already_exists(self, branch) -> bool:
        pass


class PullRequest(AbstractPullRequest):
    def __init__(self, gh: github.GitHub, pr: typing.Dict[str, typing.Any]):
        self._gh = gh
        self._pr = pr

    def add_labels(self, labels: typing.Sequence[str]) -> None:
        """Adds labels to an existing pull request."""
        self._gh.update_pull_labels(self._pr, add=labels)


class ChangePusher(AbstractChangePusher):
    """Actually pushes changes to github."""

    def __init__(self, repository: str, gh: github.GitHub, synth_path: str):
        self._repository = repository
        self._gh = gh
        self._synth_path = synth_path
        # maps branch name to pr json response
        self._existing_pull_requests: typing.Dict[str, typing.Any] = {}

    def push_changes(
        self, commit_count: int, branch: str, pr_title: str, synth_log: str = ""
    ) -> AbstractPullRequest:
        git.push_changes(branch)
        trailers = _collect_trailers(commit_count)

        pr = self._existing_pull_requests.get(branch)
        new_body = build_pr_body(synth_log, trailers)
        if pr:
            pr = self._gh.update_pull_request(
                self._repository, pr["number"], body=new_body
            )
        else:
            pr = self._gh.create_pull_request(
                self._repository, branch=branch, title=pr_title[0:250], body=new_body,
            )

            # args.synth_path (and api: * labels) only exist in monorepos
            if self._synth_path:
                api_label = self._gh.get_api_label(self._repository, self._synth_path)

                if api_label:
                    self._gh.update_pull_labels(pr, add=[api_label])
        return PullRequest(self._gh, pr)

    def check_if_pr_already_exists(self, branch) -> bool:
        repo = self._repository
        owner = repo.split("/")[0]
        prs = self._gh.list_pull_requests(repo, state="open", head=f"{owner}:{branch}")

        if prs:
            pr = prs[0]
            self._existing_pull_requests[branch] = pr
            logger.info(f'PR already exists: {pr["html_url"]}')
            body: str = pr["body"]
            if REGENERATE_CHECKBOX_TEXT in body:
                logger.info("Someone requested the PR to be regenerated.")
                return False

        return bool(prs)


class SquashingChangePusher(AbstractChangePusher):
    """Wraps another change pusher to squash all commits into a single commit

    before pushing the pull request to github."""

    def __init__(self, inner_change_pusher: AbstractChangePusher):
        self.inner_change_pusher = inner_change_pusher

    def push_changes(
        self, commit_count: int, branch: str, pr_title: str, synth_log: str = ""
    ) -> AbstractPullRequest:
        if commit_count < 2:
            # Only one change, no need to squash.
            return self.inner_change_pusher.push_changes(
                commit_count, branch, pr_title, synth_log
            )

        executor.check_call(["git", "checkout", branch])  # Probably redundant.
        with tempfile.NamedTemporaryFile() as message_file:
            # Collect the commit messages into a temporary file.
            message_file.write("changes triggered by multiple versions\n\n".encode())
            message_file.flush()
            executor.run(
                ["git", "log", f"-{commit_count}", "--format=* %s%n%b"],
                stdout=message_file,
                check=True,
            )
            message_file.file.close()  # type: ignore
            # Do a git dance to construct a branch with the commits squashed.
            temp_branch = str(uuid.uuid4())
            executor.check_call(["git", "branch", "-m", temp_branch])
            executor.check_call(["git", "checkout", "master"])
            executor.check_call(["git", "checkout", "-b", branch])
            executor.check_call(["git", "merge", "--squash", temp_branch])
            executor.check_call(["git", "commit", "-F", message_file.name])
        return self.inner_change_pusher.push_changes(1, branch, pr_title, synth_log)

    def check_if_pr_already_exists(self, branch) -> bool:
        return self.inner_change_pusher.check_if_pr_already_exists(branch)


def build_pr_body(synth_log: str, trailers: str = ""):
    """Composes the pull request body with the synth_log.

    If synth_log is empty, then creates link to kokoro build log.
    """
    build_log_text = ""
    kokoro_build_id = os.environ.get("KOKORO_BUILD_ID")
    if synth_log:
        length_limit = 40000
        if len(synth_log) > length_limit:
            synth_log = "[LOG TRUNCATED]\n" + synth_log[-length_limit:]
        build_log_text = f"""
<details><summary>Log from Synthtool</summary>

```
{synth_log}
```
</details>"""
        if kokoro_build_id:
            build_log_text += f"""

Full log will be available here:
https://source.cloud.google.com/results/invocations/{kokoro_build_id}/targets"""
    elif kokoro_build_id:
        build_log_text = f"""Synth log will be available here:
https://source.cloud.google.com/results/invocations/{kokoro_build_id}/targets"""

    return f"""\
This PR was generated using Autosynth. :rainbow:

{build_log_text}

{REGENERATE_CHECKBOX_TEXT.replace('[x]', '[ ]')} (May take up to 24 hours.)

{trailers}
""".strip()


def _collect_trailers(commit_count: int, git_dir: typing.Optional[str] = None) -> str:
    """Collects the trailers from recent commits in the repo.

    Only collects the two trailers we're interested in.
    Arguments:
        commit_count {int} -- Number of commits to collect trailers from.

    Keyword Arguments:
        git_dir {typing.Optional[str]} -- directory of git repo (default: {None})

    Returns:
        str -- The trailer lines from the recent commits.
    """
    text = executor.run(
        ["git", "log", f"-{commit_count}", "--pretty=%b"],
        universal_newlines=True,
        check=True,
        stdout=subprocess.PIPE,
        cwd=git_dir,
    ).stdout
    return _parse_trailers(text)


def _parse_trailers(text: str) -> str:
    """Parses and returns trailers in the text.

    Arguments:
        text {str} -- commit body text with trailers

    Returns:
        str -- the trailer lines.
    """
    lines = text.splitlines()
    trailer = re.compile(r"\s*(Source-Link:|PiperOrigin-RevId:).*")
    return "\n".join([line for line in lines if trailer.match(line)])
