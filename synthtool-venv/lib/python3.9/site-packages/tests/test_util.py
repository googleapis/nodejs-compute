# Copyright 2021 Google LLC
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

import os
from pathlib import Path

from . import util

TEST_PATH = Path(__file__).parent / "testdata"


def test_chdir():
    cwd = os.getcwd()
    with util.chdir(TEST_PATH):
        assert os.getcwd().endswith("/testdata")

    assert os.getcwd() == cwd


def test_chdir_str():
    cwd = os.getcwd()
    with util.chdir(str(TEST_PATH)):
        assert os.getcwd().endswith("/testdata")

    assert os.getcwd() == cwd


def test_chdir_restores_on_error():
    cwd = os.getcwd()
    try:
        with util.chdir(TEST_PATH):
            raise RuntimeError("foo")
    except RuntimeError:
        pass
    assert os.getcwd() == cwd
