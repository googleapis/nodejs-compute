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

import pytest

import autosynth.abstract_source
import autosynth.git_source


@pytest.fixture(scope="module")
def git_versions_fixture():
    with tempfile.TemporaryDirectory() as temp_dir:
        yield autosynth.git_source.enumerate_versions_for_source(
            {
                "name": "secret-manager",
                "remote": "https://github.com/googleapis/nodejs-secret-manager.git",
                "sha": "f8ca222851e8e3c5ae6755b402fecc75a46588e4",
                "internalRef": "293710856",
            },
            pathlib.Path(temp_dir),
        )


def test_enumerate_versions(git_versions_fixture):
    assert len(git_versions_fixture) > 1


def test_apply_version(git_versions_fixture):
    version = git_versions_fixture[-2]
    preconfig = {}
    version.apply(preconfig)
    local_repo_path = preconfig["preclonedRepos"][
        "https://github.com/googleapis/nodejs-secret-manager.git"
    ]
    # Confirm the right repo was cloned.
    proc = subprocess.run(
        ["git", "remote", "get-url", "origin"],
        cwd=local_repo_path,
        stdout=subprocess.PIPE,
        universal_newlines=True,
    )
    proc.check_returncode()
    assert (
        "https://github.com/googleapis/nodejs-secret-manager.git" == proc.stdout.strip()
    )
    # Confirm it's checked out to the sha we requested.
    proc = subprocess.run(
        ["git", "log", "-1", "--pretty=%H"],
        cwd=local_repo_path,
        stdout=subprocess.PIPE,
        universal_newlines=True,
    )
    proc.check_returncode()
    assert version.sha == proc.stdout.strip()


def test_get_comment(git_versions_fixture):
    comment = git_versions_fixture[0].get_comment()
    assert (
        comment
        == "chore(deps): update dependency linkinator to v2\n\nSource-Author: WhiteSource Renovate <bot@renovateapp.com>\nSource-Date: Mon Feb 10 18:05:01 2020 +0100\nSource-Repo: googleapis/nodejs-secret-manager\nSource-Sha: f8ca222851e8e3c5ae6755b402fecc75a46588e4\nSource-Link: https://github.com/googleapis/nodejs-secret-manager/commit/f8ca222851e8e3c5ae6755b402fecc75a46588e4"
    )


def test_dot():
    with tempfile.TemporaryDirectory() as temp_dir:
        versions = autosynth.git_source.enumerate_versions_for_source(
            {
                "name": ".",
                "remote": "https://github.com/googleapis/nodejs-vision.git",
                "sha": "0f9110c4d94ace7facf0532e319912e48757f8cd",
                "internalRef": "293710856",
            },
            pathlib.Path(temp_dir),
        )
    assert versions == []
