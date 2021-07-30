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

import pathlib
import subprocess
import tempfile

import autosynth.git


def test_get_commit_subject():
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create a little repo with 2 commits.
        subprocess.run(["git", "init"], check=True, cwd=temp_dir)
        temp_path = pathlib.Path(temp_dir)
        _commit_file(temp_path / "a.txt", "a subject\n\nline2\nline3")
        _commit_file(temp_path / "b.txt", "b subject\n\nline3\nline4")
        # Confirm that get_commit_subject returns expected.
        subject = autosynth.git.get_commit_subject(temp_dir)
        assert "b subject" == subject


def test_get_commit_subject_with_no_subject():
    """Many commit messages, especially from commits in googleapis/googleapis like
    https://github.com/googleapis/googleapis/commit/9ff6fd3b22f99167827e89aae7778408b5e82425
    do not not have a blank line separating the subject from the body.  In such cases,
    we only want to get the first line.
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create a little repo with 1 commits.
        subprocess.run(["git", "init"], check=True, cwd=temp_dir)
        temp_path = pathlib.Path(temp_dir)
        _commit_file(temp_path / "b.txt", "b subject\nline3\nline4")
        # Confirm that get_commit_subject returns expected.
        subject = autosynth.git.get_commit_subject(temp_dir)
        assert "b subject" == subject


def _commit_file(path: pathlib.Path, content: str):
    """Writes a file and commits it to git.

    Arguments:
        path {pathlib.Path} -- The path to the file.
        content {str} -- The content to write.  Also used as the commit message.
    """
    with open(path, "wt") as f:
        f.write(content)
    subprocess.run(
        ["git", "add", str(path)], check=True, cwd=path.parent,
    )
    subprocess.run(
        ["git", "commit", "-F", str(path)], check=True, cwd=path.parent,
    )
