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
import typing
import pathlib
from autosynth import executor

GLOBAL_GITIGNORE = """
__pycache__/
*.py[cod]
*$py.class
"""

GLOBAL_GITIGNORE_FILE = os.path.expanduser("~/.autosynth-gitignore")


def configure_git(user: str, email: str) -> None:
    with open(GLOBAL_GITIGNORE_FILE, "w") as fh:
        fh.write(GLOBAL_GITIGNORE)

    executor.check_call(
        ["git", "config", "--global", "core.excludesfile", GLOBAL_GITIGNORE_FILE]
    )
    executor.check_call(["git", "config", "user.name", user])
    executor.check_call(["git", "config", "user.email", email])
    executor.check_call(["git", "config", "push.default", "simple"])


def setup_branch(branch: str) -> None:
    executor.check_call(["git", "branch", "-f", branch])
    executor.check_call(["git", "checkout", branch])


def get_last_commit_to_file(file_path: str) -> str:
    """Returns the commit hash of the most recent change to a file."""
    parent_dir = pathlib.Path(file_path).parent
    proc = executor.run(
        ["git", "log", "--pretty=format:%H", "-1", "--no-decorate", file_path],
        stdout=subprocess.PIPE,
        universal_newlines=True,
        cwd=parent_dir,
    )
    proc.check_returncode()
    return proc.stdout.strip()


def get_commit_shas_since(sha: str, dir: str) -> typing.List[str]:
    """Gets the list of shas for commits committed after the given sha.

    Arguments:
        sha {str} -- The sha in the git history.
        dir {str} -- An absolute path to a directory in the git repository.

    Returns:
        typing.List[str] -- A list of shas.  The 0th sha is sha argument (the oldest sha).
    """
    proc = executor.run(
        ["git", "log", f"{sha}..HEAD", "--pretty=%H", "--no-decorate"],
        universal_newlines=True,
        stdout=subprocess.PIPE,
        cwd=dir,
    )
    proc.check_returncode()
    shas = proc.stdout.split()
    shas.append(sha)
    shas.reverse()
    return shas


def commit_all_changes(message: str) -> int:
    """Commits all changes in the repo.

    Args:
        message (str): the commit message

    Returns:
        int: 1 if a change was commited, otherwise 0.
    """
    executor.check_call(["git", "add", "-A"])
    status = executor.run(
        ["git", "status", "--porcelain"],
        universal_newlines=True,
        stdout=subprocess.PIPE,
        check=True,
    ).stdout.strip()
    if status:
        executor.check_call(["git", "commit", "-m", message])
        return 1
    else:
        # There are no changes to commit.
        return 0


def push_changes(branch):
    executor.check_call(["git", "push", "--force", "origin", branch])


def get_repo_root_dir(repo_path: str) -> str:
    """Given a path to a file or dir in a repo, find the root directory of the repo.

    Arguments:
        repo_path {str} -- Any path into the repo.

    Returns:
        str -- The repo's root directory.
    """
    path = pathlib.Path(repo_path)
    if not path.is_dir():
        path = path.parent
    proc = executor.run(
        ["git", "rev-parse", "--show-toplevel"],
        stdout=subprocess.PIPE,
        universal_newlines=True,
        cwd=str(path),
    )
    proc.check_returncode()
    return proc.stdout.strip()


def patch_merge(
    branch_name: str, patch_file_path: str, git_repo_dir: str = None
) -> None:
    """Merges a branch via `git diff | git apply`.

    Does not commit changes.  Modifies files only.
    Arguments:
        branch_name {str} -- The other branch to merge into this one.
        patch_file_path {str} -- The path where the patch file will be (over)written.

    Keyword Arguments:
        git_repo_dir {str} -- The repo directory (default: current working directory)
    """
    with open(patch_file_path, "wb+") as patch_file:
        executor.check_call(
            ["git", "diff", "--binary", "HEAD", branch_name],
            stdout=patch_file,
            cwd=git_repo_dir,
        )
    if os.stat(patch_file_path).st_size:
        executor.check_call(["git", "apply", patch_file_path], cwd=git_repo_dir)


def get_commit_subject(repo_dir: str = None, sha: str = None) -> str:
    """Gets the subject line of the a commit.

    Keyword Arguments:
        repo_dir {str} -- a directory in the repo; None means use cwd. (default: {None})
        sha {str} -- the sha of the commit.  None means the most recent commit.

    Returns:
        {str} -- the subject line
    """
    commit_message: str = executor.run(
        ["git", "log", "-1", "--no-decorate", "--format=%B"] + ([sha] if sha else []),
        stdout=subprocess.PIPE,
        universal_newlines=True,
        check=True,
        cwd=repo_dir,
    ).stdout
    lines = commit_message.splitlines()
    return lines[0].strip() if lines else ""
