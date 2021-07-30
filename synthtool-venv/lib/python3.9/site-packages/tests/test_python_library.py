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

import os
from pathlib import Path

import pytest

from synthtool import gcp
from synthtool.sources import templates
from . import util


PYTHON_LIBRARY = Path(__file__).parent.parent / "synthtool/gcp/templates/python_library"


@pytest.mark.parametrize(
    ["template_kwargs", "expected_text"],
    [
        ({}, ["import nox", 'session.install("-e", ".", "-c", constraints_path)']),
        (
            {"unit_test_local_dependencies": ["../testutils", "../unitutils"]},
            [
                'session.install("-e", "../testutils", "-c", constraints_path)',
                'session.install("-e", "../unitutils", "-c", constraints_path)',
            ],
        ),
        (
            {"system_test_local_dependencies": ["../testutils", "../sysutils"]},
            [
                'session.install("-e", "../testutils", "-c", constraints_path)',
                'session.install("-e", "../sysutils", "-c", constraints_path)',
            ],
        ),
        (
            {"unit_test_extras": ["abc", "def"]},
            ['session.install("-e", ".[abc,def]", "-c", constraints_path)'],
        ),
        (
            {"system_test_extras": ["abc", "def"]},
            ['session.install("-e", ".[abc,def]", "-c", constraints_path)'],
        ),
        (
            {"unit_test_extras_by_python": {"3.8": ["abc", "def"]}},
            [
                'if session.python == "3.8":\n        extras = "[abc,def]"',
                'else:\n        extras = ""',
                'session.install("-e", f".{extras}", "-c", constraints_path)',
            ],
        ),
        (
            {"system_test_extras_by_python": {"3.8": ["abc", "def"]}},
            [
                'if session.python == "3.8":\n        extras = "[abc,def]"',
                'else:\n        extras = ""',
                'session.install("-e", f".{extras}", "-c", constraints_path)',
            ],
        ),
        (
            {
                "unit_test_extras": ["tuv", "wxyz"],
                "unit_test_extras_by_python": {"3.8": ["abc", "def"]},
            },
            [
                'if session.python == "3.8":\n        extras = "[abc,def]"',
                'else:\n        extras = "[tuv,wxyz]"',
                'session.install("-e", f".{extras}", "-c", constraints_path)',
            ],
        ),
        (
            {
                "system_test_extras": ["tuv", "wxyz"],
                "system_test_extras_by_python": {"3.8": ["abc", "def"]},
            },
            [
                'if session.python == "3.8":\n        extras = "[abc,def]"',
                'else:\n        extras = "[tuv,wxyz]"',
                'session.install("-e", f".{extras}", "-c", constraints_path)',
            ],
        ),
    ],
)
def test_library_noxfile(template_kwargs, expected_text):
    t = templates.Templates(PYTHON_LIBRARY)
    result = t.render("noxfile.py.j2", **template_kwargs,).read_text()
    # Validate Python syntax.
    result_code = compile(result, "noxfile.py", "exec")
    assert result_code is not None
    for expected in expected_text:
        assert expected in result


def test_python_library():
    with util.chdir(Path(__file__).parent / "fixtures/python_library"):
        template_dir = Path(__file__).parent.parent / "synthtool/gcp/templates"
        common = gcp.CommonTemplates(template_path=template_dir)
        templated_files = common.py_library()

        assert os.path.exists(templated_files / ".kokoro/docs/docs-presubmit.cfg")
        assert os.path.exists(templated_files / ".kokoro/docker/docs/Dockerfile")


def test_split_system_tests():
    with util.chdir(Path(__file__).parent / "fixtures/python_library"):
        template_dir = Path(__file__).parent.parent / "synthtool/gcp/templates"
        common = gcp.CommonTemplates(template_path=template_dir)
        templated_files = common.py_library(split_system_tests=True)

        with open(templated_files / ".kokoro/presubmit/presubmit.cfg", "r") as f:
            contents = f.read()
            assert "RUN_SYSTEM_TESTS" in contents
            assert "false" in contents

        assert os.path.exists(templated_files / ".kokoro/presubmit/system-3.8.cfg")
        with open(templated_files / ".kokoro/presubmit/system-3.8.cfg", "r") as f:
            contents = f.read()
            assert "system-3.8" in contents
