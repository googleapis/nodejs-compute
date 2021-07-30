#!/usr/bin/env python3
# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Synthesizes multiple libraries and reports status."""

import argparse
import functools
import importlib
import os
import pathlib
import subprocess
import sys
import typing
from typing import Any, List

import requests
import yaml
from synthtool.report import make_report

from autosynth import executor, github, synth
from autosynth.log import logger

# Callable type to help dependency inject for testing
Runner = typing.Callable[
    [typing.List[str], typing.Any, pathlib.Path], typing.Tuple[int, bytes]
]


def _execute(
    command: typing.List[str], env: typing.Any, log_file_path: pathlib.Path
) -> typing.Tuple[int, bytes]:
    """Helper to wrap command invocation for testing"""
    # Ensure the logfile directory exists
    log_file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(log_file_path, "wb+") as log_file:
        result = executor.run(
            command=command,
            stdout=log_file,
            stderr=subprocess.STDOUT,
            check=False,
            encoding="utf-8",
            env=env,
        )
    with open(log_file_path, "rb") as fp:
        return (result.returncode, fp.read())


def synthesize_library(
    library: typing.Dict,
    github_token: str,
    extra_args: typing.List[str],
    base_log_path: pathlib.Path,
    runner: Runner = _execute,
) -> typing.Dict:
    """Run autosynth on a single library.

    Arguments:
        library {dict} - Library configuration

    """
    logger.info(f"Synthesizing {library['name']}.")

    command = [sys.executable, "-m", "autosynth.synth"]

    env = os.environ
    env["GITHUB_TOKEN"] = github_token

    library_args = [
        "--repository",
        library["repository"],
        "--synth-path",
        library.get("synth-path", ""),
        "--branch-suffix",
        library.get("branch-suffix", ""),
        "--pr-title",
        library.get("pr-title", ""),
        "--base-log-dir",
        str(base_log_path),
    ]

    if library.get("metadata-path"):
        library_args.extend(["--metadata-path", library.get("metadata-path")])

    if library.get("deprecated-execution", False):
        library_args.append("--deprecated-execution")

    log_file_dir = (
        pathlib.Path(base_log_path)
        / pathlib.Path(library.get("synth-path", "") or library["repository"]).name
    )
    log_file_path = log_file_dir / "sponge_log.log"
    # run autosynth in a separate process
    (returncode, output) = runner(
        command + library_args + library.get("args", []) + extra_args,
        env,
        log_file_path,
    )
    error = returncode not in (0, synth.EXIT_CODE_SKIPPED)
    skipped = returncode == synth.EXIT_CODE_SKIPPED
    # Leave a sponge_log.xml side-by-side with sponge_log.log, and sponge
    # will understand they're for the same task and render them accordingly.
    results = [
        {
            "name": library["name"],
            "error": error,
            "output": "See the test log.",
            "skipped": skipped,
        }
    ]
    make_report(library["name"], results, log_file_dir)
    if error:
        logger.error(f"Synthesis failed for {library['name']}")
    return {
        "name": library["name"],
        "output": output.decode("utf-8", errors="ignore"),
        "error": error,
        "skipped": skipped,
    }


@functools.lru_cache()
def _list_issues_cached(gh, *args, **kwargs):
    """A caching wrapper for listing issues, so we don't expend our quota."""
    return list(gh.list_issues(*args, **kwargs))


def _close_issue(gh, repository: str, existing_issue: dict):
    if existing_issue is None:
        return

    logger.info(f"Closing issue: {existing_issue['url']}")
    gh.create_issue_comment(
        repository,
        issue_number=existing_issue["number"],
        comment="Autosynth passed, closing! :green_heart:",
    )
    gh.patch_issue(
        repository, issue_number=existing_issue["number"], state="closed",
    )


def _get_sponge_log_url(repository: str) -> str:
    invocation_id = os.environ.get("KOKORO_BUILD_ID")
    target = repository.split("/")[-1]
    return f"http://sponge2/results/invocations/{invocation_id}/targets/github%2Fsynthtool;config=default/tests;query={target};failed=false"


def _file_or_comment_on_issue(
    gh, name, repository, issue_title, existing_issue, output
):
    # GitHub rejects issues with bodies > 64k
    output_to_report = output[-10000:]
    sponge_log_url = _get_sponge_log_url(repository)
    message = f"""\
Please investigate and fix this issue within 5 business days.  While it remains broken,
this library cannot be updated with changes to the {name} API, and the library grows
stale.

See https://github.com/googleapis/synthtool/blob/master/autosynth/TroubleShooting.md
for trouble shooting tips.

Here's the output from running `synth.py`:

```
{output_to_report}
```

Google internal developers can see the full log [here]({sponge_log_url}).
"""

    if not existing_issue:
        issue_details = (
            f"Hello! Autosynth couldn't regenerate {name}. :broken_heart:\n\n{message}"
        )
        labels = ["autosynth failure", "priority: p1", "type: bug"]

        api_label = gh.get_api_label(repository, name)
        if api_label:
            labels.append(api_label)

        issue = gh.create_issue(
            repository, title=issue_title, body=issue_details, labels=labels,
        )
        logger.info(f"Opened issue: {issue['url']}")

    # otherwise leave a comment on the existing issue.
    else:
        comment_body = (
            f"Autosynth is still having trouble generating {name}. :sob:\n\n{message}"
        )

        gh.create_issue_comment(
            repository, issue_number=existing_issue["number"], comment=comment_body,
        )
        logger.info(f"Updated issue: {existing_issue['url']}")


def report_to_github(gh, name: str, repository: str, error: bool, output: str) -> None:
    """Update GitHub with the status of the autosynth run.

    On failure, will either open a new issue or comment on an existing issue. On
    success, will close any open autosynth issues.

    Arguments:
        name {str} - Name of the library
        repository {str} - GitHub repository with the format [owner]/[repo]
        error {bool} - Whether or not the autosynth run failed
        output {str} - Output of the individual autosynth run
    """
    issue_title = f"Synthesis failed for {name}"

    # Get a list of all open autosynth failure issues, and check if there's
    # an existing one.
    open_issues = _list_issues_cached(
        gh, repository, state="open", label="autosynth failure"
    )
    existing_issues = [issue for issue in open_issues if issue["title"] == issue_title]
    existing_issue = existing_issues[0] if len(existing_issues) else None

    # If successful, close any outstanding issues for synthesizing this
    # library.
    if not error:
        _close_issue(gh, repository, existing_issue)
    # Otherwise, file an issue or comment on an existing issue for synthesis.
    else:
        _file_or_comment_on_issue(
            gh, name, repository, issue_title, existing_issue, output
        )


def load_config(
    config: str,
) -> typing.Optional[typing.List[typing.Dict[str, typing.Any]]]:
    """Load configuration from either a configuration YAML or from a module.

    If a yaml path is provided, it must return a top level "libraries" entry
    which contains a list of repository definitions.

    If a module is provided, it will invoke list_repositories() on the
    module which should return a list of repository definitions.

    A repository definition is a dictionary which contains:
    * name {str} -- Required. The name of the repo/client
    * repository {str} -- Required. GitHub repository with the format [owner]/[repo]
    * synth-path {str} -- Optional. Path within the repository to the synth.py file.
    * branch-suffix {str} -- Optional. When opening a pull request, use this suffix for
        branch name
    * metadata-path {str} -- Optional. Path to location of synth.metadata file.
    * deprecated-execution {bool} -- Optional. If set, will invoke synthtool with the
        synthtool binary rather than as a module. Defaults to False.
    * no_create_issue {bool} -- Optional. If set, will not manage GitHub issues when
        autosynth fails for any reason. Defaults to False.

    Arguments:
        config {str} -- Path to configuration YAML or module name

    Returns:
        List[Dict[str, Any]] - List of library configurations to synthesize
        None - The configuration file doesn't exist and no module found
    """
    if os.path.exists(config):
        with open(config) as fh:
            return yaml.load(fh, Loader=yaml.FullLoader)["libraries"]
    else:
        try:
            provider = importlib.import_module(config)
            return provider.list_repositories()  # type: ignore
        except (ImportError, AttributeError) as e:
            logger.warning("Failed to load %s", config)
            logger.warning("%s", e)
    return None


def synthesize_libraries(
    libraries: typing.Dict,
    gh: github.GitHub,
    github_token: str,
    extra_args: typing.List[str],
    base_log_path: pathlib.Path,
    runner: Runner = _execute,
) -> typing.List[typing.Dict]:
    """Synthesize all libraries and report any error as GitHub issues.

    Arguments:
        libraries {typing.List[typing.Dict]} -- Autosynth configuration. See load_config
            for more information on the structure.
        gh {github.GitHub} -- GitHub API wrapper
        github_token {str} -- API Token for GitHub
        extra_args {typing.List[str]} -- Additional command line arguments to pass to autosynth.synth

    Returns:
        typing.List[typing.Dict] -- List of results for each autosynth.synth run.
    """
    results = []
    for library in libraries:
        result = synthesize_library(
            library, github_token, extra_args[1:], base_log_path, runner
        )
        results.append(result)

        # skip issue management
        if library.get("no_create_issue"):
            continue

        try:
            report_to_github(
                gh=gh,
                name=library["name"],
                repository=library["repository"],
                error=result["error"],
                output=result["output"],
            )
        except requests.HTTPError:
            # ignore as GitHub commands already log errors on failure
            pass
    return results


def find_base_log_path() -> pathlib.Path:
    """Finds the base directory for logs.

    The log path directory gets rendered in sponge and fusion, and sometimes long
    paths get cut off.  So try for a short path name.
    """
    cwd_path = pathlib.Path(os.getcwd())
    # Search through parent directories for a directory called src, because that's the
    # root of the tree that kokoro scans when collecting logs.
    for path in [cwd_path] + list(cwd_path.parents):
        if path.name == "src":
            return path / "logs"
    return cwd_path / "logs"


def shard_list(alist: List[Any], shard_count: int) -> List[List[Any]]:
    """Breaks the list up into roughly-equally sized shards.

    Args:
        alist: A list of things.
        shard_count (int): The total number of shards.

    Returns:
        List[List[Any]]: The shards.
    """
    shard_size = len(alist) / shard_count
    shard_start = 0.0
    shards = []
    for i in range(shard_count - 1):
        shard_end = shard_start + shard_size
        shards.append(alist[int(shard_start) : int(shard_end)])  # noqa: E203
        shard_start = shard_end
    shards.append(alist[int(shard_start) :])  # noqa: E203
    return shards


def select_shard(config, shard: str):
    shard_number, shard_count = map(int, shard.split("/"))
    logger.info(f"Selecting shard {shard_number} of {shard_count}.")
    config.sort(key=lambda repo: repo["name"])
    return shard_list(config, shard_count)[shard_number]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config")
    parser.add_argument("--github-token", default=os.environ.get("GITHUB_TOKEN"))
    parser.add_argument(
        "--shard",
        default=os.environ.get("MULTISYNTH_SHARD"),
        help="From the list of repos, the shard number and shard count, separated by a forward slash.  Examples:\n0/10\n1/2",
    )
    parser.add_argument("extra_args", nargs=argparse.REMAINDER)

    args = parser.parse_args()

    config = load_config(args.config)
    if config is None:
        sys.exit("No configuration could be loaded.")

    if args.shard:
        config = select_shard(config, args.shard)

    gh = github.GitHub(args.github_token)

    base_log_path = find_base_log_path()
    results = synthesize_libraries(
        config, gh, args.github_token, args.extra_args[1:], base_log_path
    )

    num_failures = len([result for result in results if result["error"]])
    if num_failures > 0:
        logger.error(f"Failed to synthesize {num_failures} job(s).")
        failure_percent = 100 * num_failures / len(results)
        if failure_percent < 12:
            pass  # It's most likely an issue with a few APIs.
        else:
            sys.exit(1)  # Raise the attention of autosynth maintainers.


if __name__ == "__main__":
    main()
