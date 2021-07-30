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

import datetime
import pathlib
import re
import subprocess
import typing

import synthtool.sources.git as synthtool_git

import autosynth.abstract_source
from autosynth import git, executor


def _strip_pr_number(commit_subject: str) -> str:
    """Strips PR numbers from commit subjects.

    Because the PR# is for a different repo, and is misinterpreted by github as
    referring to an issue in the current repo.
    See https://github.com/googleapis/synthtool/issues/596
    Arguments:
        commit_subject {str} -- The subject line of a commit.

    Returns:
        str -- The subject line, with any commit hash removed.
    """
    match = re.match(r"^(.*?)\s*\(#\d+\)$", commit_subject)
    if match:
        return match.group(1)
    else:
        return commit_subject


class GitSourceVersion(autosynth.abstract_source.AbstractSourceVersion):
    def __init__(
        self,
        repo_path: str,
        sha: str,
        remote: str,
        source_description: str,
        source_name: str,
    ):
        self.repo_path = repo_path
        self.sha = sha
        self.remote = remote
        self.source_description = source_description
        self.source_name = source_name
        self.timestamp: typing.Optional[datetime.datetime] = None
        self.comment: typing.Optional[str] = None

    def apply(self, preconfig: typing.Dict) -> None:
        # Tell the preconfig where to find the local clone of the repo.
        precloned_repos = preconfig.get("preclonedRepos", {})
        if not precloned_repos:
            preconfig["preclonedRepos"] = precloned_repos
        precloned_repos[self.remote] = self.repo_path
        # Check out my hash.
        executor.run(
            ["git", "checkout", self.sha], cwd=self.repo_path
        ).check_returncode()

    def _get_pretty(self, pretty: str) -> str:
        """Gets the pretty log for this commit.

        Arguments:
            pretty {str} -- the git log pretty format

        Returns:
            str -- the output of the git log command, stripped of leading and trailing
                   whitespace
        """
        git_log: str = executor.run(
            ["git", "log", self.sha, "-1", "--no-decorate", f"--pretty={pretty}"],
            cwd=self.repo_path,
            stdout=subprocess.PIPE,
            universal_newlines=True,
            check=True,
        ).stdout.strip()
        return git_log

    def get_comment(self) -> str:
        # Construct a comment using the text of the git commit.
        if self.comment is None:
            subject = _strip_pr_number(self._get_pretty("%s"))
            pretty = "%b%n%nSource-Author: %an <%ae>%nSource-Date: %ad"
            body = self._get_pretty(pretty)
            git_log = f"{subject}\n\n{body}".strip()
            self.comment = _compose_comment(self.remote, self.sha, git_log)
        return self.comment

    def get_source_description(self) -> str:
        return self.source_description

    def get_source_name(self) -> str:
        return self.source_name

    def get_timestamp(self) -> datetime.datetime:
        if self.timestamp is None:
            unix_timestamp = executor.run(
                ["git", "log", "-1", "--pretty=%at", self.sha],
                cwd=self.repo_path,
                universal_newlines=True,
                check=True,
                stdout=subprocess.PIPE,
            ).stdout.strip()
            self.timestamp = datetime.datetime.fromtimestamp(float(unix_timestamp))
        return self.timestamp


def _compose_comment(remote: str, sha: str, git_log: str) -> str:
    """Composes a comment describing the original (triggering) commit.

    Arguments:
        remote {str} -- a link to the remote git repo
        sha {str} -- the hash of the commit
        git_log {str} -- the git log for the commit

    Returns:
        str -- a comment describing the commit
    """
    match = re.match(r"(https://github.com/([^/]+)/([^/.]+).*?)(\.git)?", remote)
    if match:
        link = f"{match.group(1)}/commit/{sha}"
        source_repo = match.expand(r"\2/\3")
        lines = [
            git_log,
            f"Source-Repo: {source_repo}",
            f"Source-Sha: {sha}",
            f"Source-Link: {link}",
        ]
    else:
        lines = [git_log, f"Source-Repo: {remote}", f"Source-Sha: {sha}"]
    return "\n".join(lines)


def enumerate_versions_for_source(
    source: typing.Dict, temp_dir: pathlib.Path,
) -> typing.List[autosynth.abstract_source.AbstractSourceVersion]:
    """Enumerates every commit after the most recent commit for provided git source.

    Arguments:
        sources {typing.Dict[str, typing.Dict]} -- Git source data from synth.metadata

    Returns:
        typing.List[autosynth.abstract_source.AbstractSourceVersion] -- List of versions
    """
    name = source["name"]
    if name == ".":
        # Special case handled by enumerate_versions_for_generated_repo().
        return []
    remote = source["remote"]
    tail_sha = source["sha"]
    local_repo_dir = str(synthtool_git.clone(remote))
    # Get the list of commit hashes since the last library generation.
    shas = git.get_commit_shas_since(tail_sha, local_repo_dir)
    desc = f"Git repo {remote}"
    # return a version for every commit hash
    return [GitSourceVersion(local_repo_dir, sha, remote, desc, name) for sha in shas]


def enumerate_versions(
    sources: typing.List[typing.Dict[str, typing.Dict]], temp_dir: pathlib.Path,
) -> typing.List[typing.List[autosynth.abstract_source.AbstractSourceVersion]]:
    """Enumerates every commit after the most recent commit for applicable git sources.

    Given the list of sources from a synth.metadata file, creates a GitSourceVersion
    for each commit in the repository for each "git" source type. De-duplicates git
    sources by name + remote.

    Arguments:
        sources {typing.List[typing.Dict[str, typing.Dict]]} -- List of sources from synth.metadata

    Returns:
        typing.List[typing.List[autosynth.abstract_source.AbstractSourceVersion]] -- List of lists of versions (by git source)
    """
    # only pick git sources from the list
    git_sources = [source["git"] for source in sources if "git" in source]

    # deduplicate sources by name and remote
    cache = set()
    versions = []
    for git_source in git_sources:
        key = (git_source.get("name"), git_source.get("remote"))
        if key in cache:
            continue

        cache.add(key)
        source_versions = enumerate_versions_for_source(git_source, temp_dir)
        if source_versions:
            versions.append(source_versions)

    return versions


def enumerate_versions_for_working_repo(
    metadata_path: str, sources: typing.List[typing.Dict[str, typing.Dict]]
) -> typing.List[autosynth.abstract_source.AbstractSourceVersion]:
    """Enumerates every commit after the most recent commit to metadata_path.

    Special case for enumerating the change history of the repo that
    we're actually generating.

    Arguments:
        metadata_path {str} -- Metadata file path.

    Returns:
        typing.List[autosynth.abstract_source.AbstractSourceVersion] -- versions
    """
    # Get the repo root directory that contains metadata_path.
    local_repo_dir = git.get_repo_root_dir(metadata_path)
    # Find the most recent commit hash.
    head_sha = executor.run(
        ["git", "log", "-1", "--pretty=%H"],
        stdout=subprocess.PIPE,
        universal_newlines=True,
        cwd=local_repo_dir,
        check=True,
    ).stdout.strip()
    # Get the remote url.
    remote = executor.run(
        ["git", "remote", "get-url", "origin"],
        stdout=subprocess.PIPE,
        universal_newlines=True,
        cwd=local_repo_dir,
        check=True,
    ).stdout.strip()
    desc = f"This git repo ({remote})"
    version = GitSourceVersion(local_repo_dir, head_sha, remote, desc, "self")
    # The change from this repository must always be built first.
    version.timestamp = datetime.datetime.fromtimestamp(0)
    return [version]
