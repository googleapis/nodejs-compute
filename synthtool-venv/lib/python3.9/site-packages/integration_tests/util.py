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

import io
import os
import pathlib
import re
import subprocess
import sys
import tempfile
import typing
import uuid
from unittest import mock

import autosynth.github
import autosynth.synth


def _setup_branch_at(commit_hash: str):
    """Creates a mock setup_branch function that sets up the branch at a given commit_hash.

    Arguments:
        commit_hash -- the hash or branch name to check out.

    Returns:
        function -- a setup_branch function replacement to be used with mock.patch()
    """

    def setup_branch(branch):
        subprocess.check_call(["git", "checkout", commit_hash])
        subprocess.check_call(["git", "branch", branch])
        subprocess.check_call(["git", "checkout", branch])

    return setup_branch


def generate(repository: str, commit_hash="master", synth_path="") -> str:
    """Run synthtool on the repo and record the results as a git log.

    Arguments:
        repository {str} -- something like googleapis/nodejs-vision

    Keyword Arguments:
        commit_hash {str} -- a commit hash or branch to checkout (default: {"master"})

    Returns:
        str -- path to the git log file
    """
    # Use mocks to prevent any changes from being pushed up to github.
    with tempfile.TemporaryDirectory() as tmpdir, mock.patch(
        "autosynth.git.setup_branch"
    ) as mock_setup_branch, mock.patch(
        "autosynth.github.GitHub.create_pull_request"
    ), mock.patch(
        "autosynth.git.push_changes"
    ), ModifiedEnvironment(
        {
            "GITHUB_USER": "Autosynth",
            # Use a random branch suffix to make sure check_if_pr_already_exists()
            # always returns false.
            "BRANCH_SUFFIX": f"test-{uuid.uuid4()}",
            "SYNTH_PATH": synth_path,
        }
    ), OsChdirContext(
        tmpdir
    ):
        sys.argv = sys.argv[0:1] + ["--repository", repository]
        mock_setup_branch.side_effect = _setup_branch_at(commit_hash)

        # Invoke main.
        commit_count = 0
        try:
            commit_count = autosynth.synth.main()
        except SystemExit as sysexit:
            if sysexit.code == autosynth.synth.EXIT_CODE_SKIPPED:
                pass  # Nothing changed, and that's ok.
            else:
                raise
        handle, git_log_path = tempfile.mkstemp(".log")
        # Collect the full git log.
        log_cmd = ["git", "log", f"-{commit_count or 1}", "-p", "--no-decorate"]
        log_cmd.extend(["--", ".", ":(exclude)synth.metadata"])
        with os.fdopen(handle, "w") as git_log:
            subprocess.run(
                log_cmd, stdout=git_log,
            )
        return git_log_path


def get_testdata_file_path(rel_path: str) -> pathlib.Path:
    """Gets the full path to a file in the testdata directory.

    Arguments:
        rel_path -- path relative to testdata/

    Returns:
        pathlib.Path -- the full path to the file.
    """
    return pathlib.Path(__file__).parent / "testdata" / rel_path


def log_lines_match(a_line: str, b_line: str) -> bool:
    """Compares two lines from two git log files to see if they match.

    Ignores varying content in the 3 commit header lines.
    Arguments:
        a_line {str} -- line from a git log
        b_line {str} -- line from another git log

    Returns:
        bool -- True if the lines match.
    """
    # Skip the commit header lines because they vary.
    if a_line == b_line:
        return True
    commit_header = [
        re.compile(r"\s*commit [a-f0-9]+\s*"),
        re.compile(r"\s*Author:.*", re.DOTALL),
        re.compile(r"\s*Date:.*", re.DOTALL),
        re.compile(r"\s*index [0-9a-f]+..[0-9a-f]+ [0-9]+\s*"),
    ]
    for commit_header_line in commit_header:
        if commit_header_line.fullmatch(a_line) and commit_header_line.fullmatch(
            b_line
        ):
            return True
    return False


def open_log(path: str):
    if os.path.isfile(path):
        return open(path, "rt")
    else:
        return io.StringIO("")


def assert_git_logs_match(
    generated_log_file_path,
    golden_log_file_path,
    lines_match: typing.Callable[[str, str], bool] = log_lines_match,
) -> None:
    """Compares the contents of two git log files.
    """
    line_count = 0
    with open_log(generated_log_file_path) as a:
        with open_log(golden_log_file_path) as b:
            # Compare every line the follows.
            while True:
                line_count += 1
                a_line = a.readline()
                b_line = b.readline()
                assert lines_match(
                    a_line, b_line
                ), f"""Generated log file and golden log file differ at line {line_count}.
{a_line}{b_line}The golden file can be updated with the following command:\n
cp {generated_log_file_path} {golden_log_file_path}"""
                if not a_line:
                    break


class ModifiedEnvironment:
    """Modifies os.environ for the duration of the context."""

    def __init__(self, env_vars: typing.Mapping[str, str]):
        """
        Arguments:
            env_vars {typing.Dict} -- Environment variables to set in os.environ.
        """
        self.env_vars = env_vars
        self.old_vars: typing.Dict[str, str] = {}

    def __enter__(self):
        for key in self.env_vars.keys():
            self.old_vars[key] = os.environ.get(key, "")
        os.environ.update(self.env_vars)

    def __exit__(self, type, value, traceback):
        os.environ.update(self.old_vars)


class OsChdirContext:
    """Changes the current working directory for the duration of the context."""

    def __init__(self, dir):
        self.dir = dir

    def __enter__(self):
        self.old_dir = os.getcwd()
        os.chdir(self.dir)

    def __exit__(self, type, value, traceback):
        os.chdir(self.old_dir)
