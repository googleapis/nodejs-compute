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

"""Synthesizes a single library and sends a PR."""

import argparse
import os
import pathlib
import sys
import tempfile
import typing

import autosynth
import autosynth.flags
import synthtool.sources.git as synthtool_git
from autosynth import executor, git, git_source, github
from autosynth.change_pusher import (
    AbstractChangePusher,
    ChangePusher,
    SquashingChangePusher,
)
from autosynth.log import logger
from autosynth.synthesizer import AbstractSynthesizer, Synthesizer
from autosynth.synth_toolbox import (
    SynthesizeLoopToolbox,
    load_metadata,
    has_changes,
)

EXIT_CODE_SKIPPED = 28


def synthesize_loop(
    toolbox: SynthesizeLoopToolbox,
    multiple_prs: bool,
    change_pusher: AbstractChangePusher,
    synthesizer: AbstractSynthesizer,
) -> int:
    """Loops through all source versions and creates a commit for every version
    changed that caused a change in the generated code.

    Arguments:
        toolbox {SynthesizeLoopToolbox} -- a toolbox
        multiple_prs {bool} -- True to create one pull request per source.
        change_pusher {AbstractChangePusher} -- Used to push changes to github.
        synthesizer {AbstractSynthesizer} -- Invokes synthesize.

    Returns:
        int -- Number of commits committed to this repo.
    """
    if not toolbox.versions:
        return 0  # No versions, nothing to synthesize.

    # Synthesize the library with the most recent versions of all sources.
    youngest = len(toolbox.versions) - 1
    has_changes = toolbox.synthesize_version_in_new_branch(synthesizer, youngest)
    if not has_changes:
        if (
            not toolbox.metadata_contains_generated_files(toolbox.branch)
            and toolbox.metadata_contains_generated_files(toolbox.sub_branch(youngest))
            and not change_pusher.check_if_pr_already_exists(toolbox.branch)
        ):
            # Special case: the repo owner turned on obsolete file tracking.
            # Generate a one-time PR containing only metadata changes.
            executor.check_call(["git", "checkout", toolbox.branch])
            executor.check_call(
                ["git", "merge", "--squash", toolbox.sub_branch(youngest)]
            )
            pr_title = "chore: start tracking obsolete files"
            executor.check_call(["git", "commit", "-m", pr_title])
            pr = change_pusher.push_changes(1, toolbox.branch, pr_title)
            pr.add_labels(["context: full"])
            return 1
        return 0  # No changes, nothing to do.

    try:
        if multiple_prs:
            commit_count = 0
            for fork in toolbox.fork():
                if change_pusher.check_if_pr_already_exists(fork.branch):
                    continue
                executor.check_call(["git", "checkout", fork.branch])
                synthesize_inner_loop(fork, synthesizer)
                commit_count += fork.commit_count
                if fork.source_name == "self" or fork.count_commits_with_context() > 0:
                    fork.push_changes(change_pusher)
            return commit_count
    except Exception as e:
        logger.error(e)
        # Fallback to the single_pr loop to try to make some progress.
        synthesize_loop_single_pr(toolbox, change_pusher, synthesizer)
        # But still report the failure.
        raise

    return synthesize_loop_single_pr(toolbox, change_pusher, synthesizer)


def synthesize_loop_single_pr(
    toolbox: SynthesizeLoopToolbox,
    change_pusher: AbstractChangePusher,
    synthesizer: AbstractSynthesizer,
) -> int:
    """Loops through all source versions and creates a commit for every version
    changed that caused a change in the generated code.

    This function creates a single pull request for all sources.
    Arguments:
        toolbox {SynthesizeLoopToolbox} -- a toolbox
        change_pusher {AbstractChangePusher} -- Used to push changes to github.
        synthesizer {AbstractSynthesizer} -- Invokes synthesize.

    Returns:
        int -- Number of commits committed to this repo.
    """
    if change_pusher.check_if_pr_already_exists(toolbox.branch):
        return 0
    synthesize_inner_loop(toolbox, synthesizer)
    toolbox.push_changes(change_pusher)
    return toolbox.commit_count


def synthesize_inner_loop(
    toolbox: SynthesizeLoopToolbox, synthesizer: AbstractSynthesizer,
):
    # Synthesize with the most recent version of all the sources.
    if not toolbox.synthesize_version_in_new_branch(
        synthesizer, len(toolbox.versions) - 1
    ):
        return  # No differences, nothing more to do.

    # Synthesize with the oldest version of all the sources.
    if 1 == len(toolbox.versions) or toolbox.synthesize_version_in_new_branch(
        synthesizer, 0
    ):
        comment = """changes without context

        autosynth cannot find the source of changes triggered by earlier changes in this
        repository, or by version upgrades to tools such as linters."""
        toolbox.patch_merge_version(0, comment)

    # Binary search the range.
    synthesize_range(toolbox, synthesizer)


def synthesize_range(
    toolbox: SynthesizeLoopToolbox, synthesizer: AbstractSynthesizer
) -> None:
    # Loop through all the individual source versions to see which ones triggered a change.
    # version_ranges is a stack.  The code below maintains the invariant
    # that it's sorted with the oldest ranges being popped first.
    # That way, we apply changes to the current branch in order from oldest
    # to youngest.
    version_ranges: typing.List[typing.Tuple[int, int]] = [
        (0, len(toolbox.versions) - 1)
    ]
    while version_ranges:
        old, young = version_ranges.pop()
        if young == old + 1:
            # The base case: Found a version that triggered a change.
            toolbox.patch_merge_version(young)
            continue
        if not toolbox.git_branches_differ(
            toolbox.sub_branch(old), toolbox.sub_branch(young)
        ):
            continue  # No difference; no need to search range.
        # Select the middle version to synthesize.
        middle = (young - old) // 2 + old
        toolbox.synthesize_version_in_new_branch(synthesizer, middle)
        version_ranges.append((middle, young))
        version_ranges.append((old, middle))


def main() -> int:
    """
    Returns:
        int -- Number of commits committed to the repo.
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        return _inner_main(temp_dir)


def _inner_main(temp_dir: str) -> int:
    """
    Returns:
        int -- Number of commits committed to the repo.
    """
    parser = argparse.ArgumentParser()
    parser.add_argument("--github-user", default=os.environ.get("GITHUB_USER"))
    parser.add_argument("--github-email", default=os.environ.get("GITHUB_EMAIL"))
    parser.add_argument("--github-token", default=os.environ.get("GITHUB_TOKEN"))
    parser.add_argument(
        "--repository", default=os.environ.get("REPOSITORY"), required=True
    )
    parser.add_argument(
        "--synth-path",
        default=os.environ.get("SYNTH_PATH"),
        help="If specified, changes the directory from which synthtool is invoked.",
    )
    parser.add_argument(
        "--synth-file-name",
        default=os.environ.get("SYNTH_FILE_NAME"),
        help="If specified, override the synth file name and may be a path to a file. Defaults to 'synth.py'.",
    )
    parser.add_argument("--metadata-path", default=os.environ.get("METADATA_PATH"))
    parser.add_argument("--base-log-dir", default="")
    parser.add_argument(
        "--deprecated-execution",
        default=False,
        action="store_true",
        help="If specified, execute synth.py directly instead of synthtool. This behavior is deprecated.",
    )
    parser.add_argument(
        "--branch-suffix", default=os.environ.get("BRANCH_SUFFIX", None)
    )
    parser.add_argument("--pr-title", default="")
    parser.add_argument("extra_args", nargs=argparse.REMAINDER)

    args = parser.parse_args()

    gh = github.GitHub(args.github_token)

    branch = "-".join(filter(None, ["autosynth", args.branch_suffix]))

    pr_title = args.pr_title or (
        f"[CHANGE ME] Re-generated {args.synth_path or ''} to pick up changes in "
        f"the API or client library generator."
    )
    change_pusher: AbstractChangePusher = ChangePusher(args.repository, gh, branch)
    synth_file_name = args.synth_file_name or "synth.py"

    # capture logs for later
    # The logs directory path will be rendered in Sponge and Fusion as the test name,
    # so drop all the unimportant parts.
    base_log_dir = (
        pathlib.Path(args.base_log_dir)
        if args.base_log_dir
        else pathlib.Path(os.getcwd()) / "logs"
    )
    base_synth_log_path = (
        base_log_dir / pathlib.Path(args.synth_path or args.repository).name
    )
    logger.info(f"logs will be written to: {base_synth_log_path}")

    working_repo_path = synthtool_git.clone(f"https://github.com/{args.repository}.git")

    try:
        os.chdir(working_repo_path)

        git.configure_git(args.github_user, args.github_email)

        git.setup_branch(branch)

        if args.synth_path:
            os.chdir(args.synth_path)

        metadata_path = os.path.join(args.metadata_path or "", "synth.metadata")

        flags = autosynth.flags.parse_flags(synth_file_name)
        # Override flags specified in synth.py with flags specified in environment vars.
        for key in flags.keys():
            env_value = os.environ.get(key, "")
            if env_value:
                flags[key] = False if env_value.lower() == "false" else env_value

        metadata = load_metadata(metadata_path)
        multiple_commits = flags[autosynth.flags.AUTOSYNTH_MULTIPLE_COMMITS]
        multiple_prs = flags[autosynth.flags.AUTOSYNTH_MULTIPLE_PRS]
        if (not multiple_commits and not multiple_prs) or not metadata:
            if change_pusher.check_if_pr_already_exists(branch):
                return 0

            synth_log_path = base_synth_log_path
            for arg in args.extra_args:
                synth_log_path = synth_log_path / arg

            synth_log = Synthesizer(
                metadata_path,
                args.extra_args,
                deprecated_execution=args.deprecated_execution,
                synth_py_path=synth_file_name,
            ).synthesize(synth_log_path / "sponge_log.log")

            if not has_changes():
                logger.info("No changes. :)")
                sys.exit(EXIT_CODE_SKIPPED)

            git.commit_all_changes(pr_title)
            change_pusher.push_changes(1, branch, pr_title, synth_log)
            return 1

        else:
            if not multiple_prs and change_pusher.check_if_pr_already_exists(branch):
                return 0  # There's already an existing PR

            # Enumerate the versions to loop over.
            sources = metadata.get("sources", [])
            source_versions = [
                git_source.enumerate_versions_for_working_repo(metadata_path, sources)
            ]
            # Add supported source version types below:
            source_versions.extend(
                git_source.enumerate_versions(sources, pathlib.Path(temp_dir))
            )

            # Prepare to call synthesize loop.
            synthesizer = Synthesizer(
                metadata_path,
                args.extra_args,
                deprecated_execution=args.deprecated_execution,
                synth_py_path=synth_file_name,
            )
            x = SynthesizeLoopToolbox(
                source_versions,
                branch,
                temp_dir,
                metadata_path,
                args.synth_path,
                base_synth_log_path,
            )
            if not multiple_commits:
                change_pusher = SquashingChangePusher(change_pusher)

            # Call the loop.
            commit_count = synthesize_loop(x, multiple_prs, change_pusher, synthesizer)

            if commit_count == 0:
                logger.info("No changes. :)")
                sys.exit(EXIT_CODE_SKIPPED)

            return commit_count
    finally:
        if args.synth_path:
            # We're generating code in a mono repo.  The state left behind will
            # probably be useful for generating the next API.
            pass
        else:
            # We're generating a single API in a single repo, and using a different
            # repo to generate the next API.  So the next synth will not be able to
            # use any of this state.  Clean it up to avoid running out of disk space.
            executor.run(["git", "clean", "-fdx"], cwd=working_repo_path)


if __name__ == "__main__":
    main()
