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

from pathlib import Path

from synthtool.sources import templates

PYTHON_SAMPLES = Path(__file__).parent.parent / "synthtool/gcp/templates/python_samples"


def test_samples_billing():
    t = templates.Templates(PYTHON_SAMPLES)
    result = t.render(
        "README.md",
        metadata={
            "repo": {
                "name_pretty": "Bigtable",
                "repo": "googleapis/python-bigtable",
                "requires_billing": True,
                "samples": [
                    {
                        "name": "Quickstart",
                        "description": "Example sample for product",
                        "file": "quickstart.py",
                        "custom_content": "This is custom text for the sample",
                        "runnable": True,
                    },
                    {
                        "name": "Hello World",
                        "description": "Example beginner application",
                        "file": "main.py",
                    },
                ],
            }
        },
    ).read_text()
    assert "and you will need to [enable billing]" in result


def test_samples_footer():
    t = templates.Templates(PYTHON_SAMPLES)
    result = t.render(
        "README.md",
        metadata={
            "repo": {
                "name_pretty": "Storage",
                "repo": "googleapis/python-storage",
                "client_library": True,
            }
        },
    ).read_text()
    assert "Google Cloud Client Library for Python" in result
    assert "Python style guide" in result
    assert (
        '<a href="https://github.com/googleapis/python-storage">browse the source</a>'
        in result
    )


def test_samples_custom_content():
    t = templates.Templates(PYTHON_SAMPLES)
    result = t.render(
        "README.md",
        metadata={
            "repo": {
                "name_pretty": "Storage",
                "repo": "googleapis/python-storage",
                "samples": [
                    {
                        "name": "Quickstart",
                        "description": "Example sample for product",
                        "file": "quickstart.py",
                        "custom_content": "This is custom text for the sample",
                        "runnable": True,
                    }
                ],
            }
        },
    ).read_text()
    assert "This is custom text for the sample" in result


def test_samples_usage():
    t = templates.Templates(PYTHON_SAMPLES)
    result = t.render(
        "README.md",
        metadata={
            "repo": {
                "name_pretty": "Bigtable",
                "repo": "googleapis/python-bigtable",
                "product_documentation": "https://cloud.google.com/bigtable",
                "requires_billing": True,
                "samples": [
                    {
                        "name": "Quickstart",
                        "description": "Example sample for product",
                        "file": "quickstart.py",
                    },
                    {
                        "name": "Hello World",
                        "description": "Example beginner application",
                        "file": "main.py",
                    },
                ],
            }
        },
    ).read_text()
    assert "Example sample for product" in result
    assert "Example beginner application" in result
    assert "Hello World" in result
    assert '<a href="https://cloud.google.com/bigtable">' in result


def test_samples_cloudshell():
    t = templates.Templates(PYTHON_SAMPLES)
    result = t.render(
        "README.md",
        metadata={
            "repo": {
                "name_pretty": "Bigtable",
                "repo": "googleapis/python-bigtable",
                "requires_billing": True,
                "samples": [
                    {
                        "name": "Quickstart",
                        "description": "Example sample for product",
                        "file": "quickstart.py",
                        "runnable": True,
                    }
                ],
            }
        },
    ).read_text()
    assert "git_repo=https://github.com/googleapis/python-bigtable" in result
    assert "open_in_editor=quickstart.py" in result
