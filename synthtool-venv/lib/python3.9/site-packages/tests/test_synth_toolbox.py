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

import tempfile

import pytest  # type:ignore
from tests.util import make_working_repo

import autosynth.abstract_source
import autosynth.synth
from integration_tests import util


def test_compose_pr_title_with_many_commits():
    text = autosynth.synth_toolbox._compose_pr_title(3, 3, "", "")
    assert text == (
        "[CHANGE ME] Re-generated to pick up changes "
        "in the API or client library generator."
    )


def test_compose_pr_title_with_many_commits_and_source_name():
    text = autosynth.synth_toolbox._compose_pr_title(3, 3, "", "googleapis")
    assert text == ("[CHANGE ME] Re-generated to pick up changes " "from googleapis.")


def test_compose_pr_title_with_many_commits_and_synth_path():
    text = autosynth.synth_toolbox._compose_pr_title(3, 3, "automl", "")
    assert text == (
        "[CHANGE ME] Re-generated automl to pick up changes "
        "in the API or client library generator."
    )


def test_compose_pr_title_with_many_commits_and_source_name_and_synth_path():
    text = autosynth.synth_toolbox._compose_pr_title(3, 3, "automl", "googleapis")
    assert text == (
        "[CHANGE ME] Re-generated automl to pick up changes " "from googleapis."
    )


@pytest.fixture(scope="module")
def working_repo():
    with tempfile.TemporaryDirectory() as working_dir, util.OsChdirContext(working_dir):
        make_working_repo(working_dir)
        yield working_dir


def test_compose_pr_title_with_one_commit(working_repo):
    text = autosynth.synth_toolbox._compose_pr_title(1, 1, "", "")
    assert text == "c subject"


def test_compose_pr_title_with_two_commits(working_repo):
    text = autosynth.synth_toolbox._compose_pr_title(2, 1, "", "")
    assert text == (
        "[CHANGE ME] Re-generated to pick up changes "
        "in the API or client library generator."
    )


def test_compose_pr_title_with_one_commit_and_synth_path(working_repo):
    text = autosynth.synth_toolbox._compose_pr_title(1, 1, "automl", "")
    assert text == "[automl] c subject"


def test_compose_pr_title_with_one_commit_and_source_name(working_repo):
    text = autosynth.synth_toolbox._compose_pr_title(1, 1, "", "googleapis")
    assert text == "c subject"


def test_compose_pr_title_with_one_commit_and_synth_path_and_source_name(working_repo):
    text = autosynth.synth_toolbox._compose_pr_title(1, 1, "automl", "googleapis")
    assert text == "[automl] c subject"
