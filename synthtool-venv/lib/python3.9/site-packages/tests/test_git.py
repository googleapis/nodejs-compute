# Copyright 2018 Google LLC
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

import copy
import importlib
import os
import unittest
from unittest import mock

import google.protobuf
import pytest

import synthtool.preconfig
from synthtool import metadata, tmp
from synthtool.protos.preconfig_pb2 import Preconfig
from synthtool.sources import git


def test_make_repo_clone_url(monkeypatch):
    monkeypatch.setattr(git, "USE_SSH", True)
    assert (
        git.make_repo_clone_url("theacodes/nox") == "git@github.com:theacodes/nox.git"
    )


def test_make_repo_clone_url_https(monkeypatch):
    monkeypatch.setattr(git, "USE_SSH", False)
    assert (
        git.make_repo_clone_url("theacodes/nox")
        == "https://github.com/theacodes/nox.git"
    )


@pytest.mark.parametrize(
    ("input, expected"),
    [
        ("git@github.com:theacodes/nox.git", {"owner": "theacodes", "name": "nox"}),
        ("https://github.com/theacodes/nox.git", {"owner": "theacodes", "name": "nox"}),
        ("theacodes/nox", {"owner": "theacodes", "name": "nox"}),
        ("theacodes/nox.git", {"owner": "theacodes", "name": "nox"}),
    ],
)
def test_parse_repo_url(input, expected):
    assert git.parse_repo_url(input) == expected


@mock.patch("subprocess.check_output", autospec=True)
def test_get_latest_commit(check_call):
    check_call.return_value = b"abc123\ncommit\nmessage."

    sha, message = git.get_latest_commit()

    assert sha == "abc123"
    assert message == "commit\nmessage."


def test_extract_commit_message_metadata():
    message = """\
Hello, world!

One: Hello!
Two: 1234
"""
    metadata = git.extract_commit_message_metadata(message)

    assert metadata == {"One": "Hello!", "Two": "1234"}


class TestClone(unittest.TestCase):
    def setUp(self):
        # Preserve the original environment variables.
        self.env = copy.copy(os.environ)
        return super().setUp()

    def tearDown(self):
        os.environ = self.env
        return super().tearDown()

    def testClone(self):
        # clear out metadata before creating new metadata and asserting on it
        metadata.reset()

        local_directory = git.clone("https://github.com/googleapis/nodejs-vision.git")
        self.assertEqual("nodejs-vision", local_directory.name)
        self.assertEqual("nodejs-vision", metadata.get().sources[0].git.name)

        # When the repo already exists, it should pull instead.
        same_local_directory = git.clone(
            "https://github.com/googleapis/nodejs-vision.git", local_directory.parent
        )
        self.assertEqual(local_directory, same_local_directory)

    def testPrecloneMap(self):
        # Pre clone the repo into a temporary directory.
        tmpdir = tmp.tmpdir()
        local_directory = git.clone(
            "https://github.com/googleapis/nodejs-vision.git", tmpdir
        )
        # Write out a preclone map.
        preconfig_path = tmpdir / "preconfig.json"
        preconfig = Preconfig()
        preconfig.precloned_repos[
            "https://github.com/googleapis/nodejs-vision.git"
        ] = str(local_directory)
        preconfig_path.write_text(google.protobuf.json_format.MessageToJson(preconfig))
        # Reload the module so it reexamines the environment variable.
        importlib.reload(synthtool.preconfig)
        metadata.reset()
        # Confirm calling clone with the preclone map returns the precloned local directory.
        os.environ[synthtool.preconfig.PRECONFIG_ENVIRONMENT_VARIABLE] = str(
            preconfig_path
        )
        same_local_directory = git.clone(
            "https://github.com/googleapis/nodejs-vision.git"
        )
        self.assertEqual(local_directory, same_local_directory)
        # Make sure it was recorded in the metadata.
        self.assertEqual("nodejs-vision", metadata.get().sources[0].git.name)
