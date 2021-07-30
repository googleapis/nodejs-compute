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

import json
import os
import pathlib
import re
import subprocess
import tempfile
import typing
from typing import Dict, Optional, Sequence

from autosynth import executor, git
from autosynth.change_pusher import AbstractChangePusher
from autosynth.log import logger
from autosynth.abstract_source import AbstractSourceVersion
from autosynth.synthesizer import AbstractSynthesizer

IGNORED_FILE_PATTERNS = [
    # Ignore modifications to synth.metadata in any directory, this still allows *new*
    # synth.metadata files to be added.
    re.compile(r"M (.*?)synth.metadata")
]


def load_metadata(metadata_path: str) -> Dict:
    path = pathlib.Path(metadata_path)
    if not path.exists():
        return {}
    return json.loads(path.read_text())


class FlatVersion:
    """A pair of (group_number, version).

    See flatten_source_versions for more context.
    """

    def __init__(self, group_number: int, version: AbstractSourceVersion):
        self.group_number = group_number
        self.version = version
        self.sort_key = (self.version.get_timestamp(), group_number)
        self.merged = False
        # This gets set to true or false after synthesizing code for this version.
        self.branch_has_changes: Optional[bool] = None


def flatten_and_sort_source_versions(
    source_versions: typing.Sequence[typing.Sequence[AbstractSourceVersion]],
) -> typing.List[FlatVersion]:
    """Flattens groups of versions.

    For example, for the input:
    [[a, b], [c, d, e]]

    The return value will be:
    [(1, a), (1, b), (2, c), (2, d), (2, e)]
    sorted by version timestamp.

    The return value is easy to binary search, because it's linear.  But it's
    still easy to see which group each version is a member of.
    """
    flat_list = []
    for number, group in enumerate(source_versions):
        for version in group:
            flat_list.append(FlatVersion(number, version))
    flat_list.sort(key=lambda v: v.sort_key)
    return flat_list


def generate_apply_table(versions: typing.List[FlatVersion]) -> Sequence[Sequence[int]]:
    """Return a table that answers the following question:

    When applying version i, what versions from other sources do I also need to apply?
    The answer is the youngest versions of other sources that are older than version i.
    When all versions of another source are younger than version i, then choose the
    oldest version.

    So for two sources with the following versions:
    A: 1   3  4  5
    B:   2         6

    This function will return:
    [[1, 2], [1, 2], [3, 2], [4, 2], [5, 2], [5, 6]

    Precalcuting a table takes O(n) time and avoids an O(n^2) loop later.
    """
    table = []
    vmap: Dict[int, int] = {}
    # Traverse the list of versions from beginning to end, recording the most recent
    # version from each group.
    for i, version in enumerate(versions):
        vmap = dict(vmap)
        vmap[version.group_number] = i
        table.append(vmap)
    # Fill in missing versions in the beginning.
    for amap in reversed(table[:-1]):
        new_map = dict(vmap)
        new_map.update(amap)
        amap.update(new_map)
        vmap = amap
    return [list(d.values()) for d in table]


class VersionZero:
    """Info recorded to implement optimization of only synthing version zero once
    across multiple sources."""

    def __init__(self):
        self.branch_name: str = ""
        self.has_changes: bool = False


class SynthesizeLoopToolbox:
    """A convenient collection of state and functions called by synthesize_loop."""

    def __init__(
        self,
        source_versions: typing.Sequence[typing.Sequence[AbstractSourceVersion]],
        branch: str,
        temp_dir: str,
        metadata_path: str,
        synth_path: str,
        log_dir_path: pathlib.Path = None,
    ):
        self._temp_dir = temp_dir
        self._metadata_path = metadata_path
        self._preconfig_path = os.path.join(temp_dir, "preconfig.json")
        self._synth_path = synth_path or ""

        self.branch = branch
        self.version_groups = [list(group) for group in source_versions]
        self.versions = flatten_and_sort_source_versions(source_versions)
        self.apply_table = generate_apply_table(self.versions)
        self.commit_count = 0
        # Set the environment variable to point to the preconfig.json file.
        self.environ = dict(os.environ)
        self.environ["SYNTHTOOL_PRECONFIG_FILE"] = self._preconfig_path
        self.source_name = ""  # Only non-empty for forks
        self.version_zero = VersionZero()
        self.log_dir_path = log_dir_path or pathlib.Path(
            tempfile.TemporaryDirectory().name
        )

    def apply_version(self, version_index: int) -> None:
        """Applies one version from each group."""
        preconfig: typing.Dict[str, typing.Any] = {}  # protocol message
        for i in self.apply_table[version_index]:
            self.versions[i].version.apply(preconfig)
        with open(self._preconfig_path, "wt") as preconfig_file:
            json.dump(preconfig, preconfig_file)

    def sub_branch(self, version_index: int) -> str:
        """Returns the name of the sub-branch for the version."""
        return f"{self.branch}-{version_index}"

    def checkout_new_branch(self, index: int) -> None:
        """Create a new branch for the version."""
        executor.check_call(["git", "branch", "-f", self.sub_branch(index)])
        executor.check_call(["git", "checkout", self.sub_branch(index)])

    def checkout_sub_branch(self, index: int):
        """Check out the branch for the version."""
        executor.check_call(["git", "checkout", self.sub_branch(index)])

    def patch_merge_version(self, index: int, comment=None) -> bool:
        """Merges the given version into the current branch using a patch merge."""
        sub_branch = self.sub_branch(index)
        if self.git_branches_differ("HEAD", sub_branch):
            patch_file_path = os.path.join(self._temp_dir, f"{sub_branch}.patch")
            git.patch_merge(sub_branch, patch_file_path)
            git.commit_all_changes(
                comment or self.versions[index].version.get_comment()
            )
            self.commit_count += 1
            self.versions[index].merged = True
            return True
        return False

    def git_branches_differ(self, branch_a: str, branch_b: str):
        """Compares two git branches ignoring synth.metadata file."""
        return git_branches_differ(branch_a, branch_b, self._metadata_path)

    def fork(self) -> typing.List["SynthesizeLoopToolbox"]:
        """Create a new toolbox for each source.

        Each fork contains the same list of sources.  In each fork, only one
        source contains its full list of versions.  The other sources contain
        the oldest version only.
        Returns:
            [typing.List[SynthesizeLoopToolbox]] -- A toolbox for each source.
        """
        forks = []
        for i, _group in enumerate(self.version_groups):
            new_groups = [[g[0]] for g in self.version_groups]
            new_groups[i] = self.version_groups[i]
            source_name = self.version_groups[i][0].get_source_name()
            fork_branch = f"{self.branch}-{source_name}"
            fork = SynthesizeLoopToolbox(
                new_groups,
                fork_branch,
                self._temp_dir,
                self._metadata_path,
                self._synth_path,
                self.log_dir_path / source_name,
            )
            fork.source_name = source_name
            fork.commit_count = self.commit_count
            fork.version_zero = self.version_zero
            executor.check_call(["git", "branch", "-f", fork_branch])
            forks.append(fork)
        return forks

    def synthesize_version_in_new_branch(
        self, synthesizer: AbstractSynthesizer, index: int
    ) -> bool:
        """Invokes the synthesizer on the version specified by index.

        Stores the result in a new branch.
        Leaves the current branch unchanged.
        Arguments:
            synthesizer {AbstractSynthesizer} -- A synthesizer.
            index {int} -- index into self.versions

        Returns:
            bool -- True if the code generated differs.
        """
        # Did we already generate this version?  Return cached result.
        branch_already_has_changes = self.versions[index].branch_has_changes
        if branch_already_has_changes is not None:
            return branch_already_has_changes

        self.apply_version(index)
        self.checkout_new_branch(index)
        try:
            if 0 == index:
                if self.version_zero.branch_name:
                    # Reuse version zero built for another source.
                    executor.check_call(
                        ["git", "merge", "--ff-only", self.version_zero.branch_name]
                    )
                    return self.version_zero.has_changes

            synth_log_path = self.log_dir_path / str(index) / "sponge_log.log"
            if index + 1 == len(self.versions):
                # The youngest version.  Let exceptions raise because the
                # current state is broken, and there's nothing we can do.
                synthesizer.synthesize(synth_log_path, self.environ)
            else:
                synthesizer.synthesize_and_catch_exception(synth_log_path, self.environ)
            # Save changes into the sub branch.
            i_has_changes = has_changes()
            git.commit_all_changes(self.versions[index].version.get_comment())
            if 0 == index:
                # Record version zero info so other sources can reuse.
                self.version_zero.branch_name = self.sub_branch(0)
                self.version_zero.has_changes = i_has_changes
            # Cache the outcome.
            self.versions[index].branch_has_changes = i_has_changes
            return i_has_changes
        finally:
            executor.check_call(["git", "reset", "--hard", "HEAD"])
            executor.check_call(["git", "checkout", self.branch])

    def count_commits_with_context(self) -> int:
        """Returns the number of commits that could be traced to a source version."""
        return self.commit_count - 1 if self.versions[0].merged else self.commit_count

    def push_changes(self, change_pusher: AbstractChangePusher) -> None:
        """Composes a PR title and pushes changes to github."""
        if self.commit_count < 1:
            return
        pr_title = _compose_pr_title(
            self.commit_count,
            self.count_commits_with_context(),
            self._synth_path,
            self.source_name,
        )
        pr = change_pusher.push_changes(self.commit_count, self.branch, pr_title)
        # Add a label to make it easy to collect statistics about commits with context.
        if self.count_commits_with_context() == 0:
            label = "context: none"
        elif self.count_commits_with_context() == self.commit_count:
            label = "context: full"
        else:
            label = "context: partial"
        pr.add_labels([label])

    def metadata_contains_generated_files(self, branch_name: str) -> bool:
        executor.check_call(["git", "checkout", branch_name])
        metadata = load_metadata(self._metadata_path)
        return bool(metadata.get("generatedFiles"))


def _compose_pr_title(
    commit_count: int,
    commits_with_context_count: int,
    synth_path: str,
    source_name: str,
) -> str:
    """Compose a title for the pull request for changes merged by this toolbox.

    Arguments:
        commits_with_context_count {int} -- Commits with context about what triggered
        synth_path {str} -- Path to directory that contains synth.py, or empty.
        source_name {str} -- Name of the source, or empty.

    Returns:
        str -- The PR title.
    """
    synth_path_space = f"{synth_path} " if synth_path else ""
    synth_path_squared = f"[{synth_path}] " if synth_path else ""
    if 1 == commits_with_context_count and 1 == commit_count:
        return synth_path_squared + git.get_commit_subject()
    elif source_name:
        return (
            f"[CHANGE ME] Re-generated {synth_path_space}to pick up changes "
            f"from {source_name}."
        )
    else:
        return (
            f"[CHANGE ME] Re-generated {synth_path_space}to pick up changes "
            "in the API or client library generator."
        )


def git_branches_differ(branch_a: str, branch_b: str, metadata_path: str) -> bool:
    # Check to see if any files besides synth.metadata were added, modified, deleted.
    diff_cmd = ["git", "diff", "--binary", f"{branch_a}..{branch_b}"]
    diff_cmd.extend(["--", ".", f":(exclude){metadata_path}"])
    proc = executor.run(diff_cmd, stdout=subprocess.PIPE)
    proc.check_returncode()
    if bool(proc.stdout):
        return True
    # Check to see if synth.metadata was added.
    proc = executor.run(
        ["git", "diff", f"{branch_a}..{branch_b}", "--", metadata_path],
        stdout=subprocess.PIPE,
        universal_newlines=True,
    )
    proc.check_returncode()
    diff_text = proc.stdout
    pattern = "^--- /dev/null"
    return bool(re.search(pattern, diff_text, re.MULTILINE))


def has_changes():
    output = subprocess.check_output(["git", "status", "--porcelain"])
    output = output.decode("utf-8").strip()
    logger.info("Changed files:")
    logger.info(output)

    # Parse the git status output. Ignore any blank lines.
    changed_files = [line.strip() for line in output.split("\n") if line]

    # Ignore any files that are in our IGNORED_FILES set and only report
    # that there are changes if these ignored files are not the *only* changed
    # files.
    filtered_changes = []
    for file in changed_files:
        for expr in IGNORED_FILE_PATTERNS:
            if expr.match(file):
                break
        else:
            filtered_changes.append(file)

    return True if filtered_changes else False
