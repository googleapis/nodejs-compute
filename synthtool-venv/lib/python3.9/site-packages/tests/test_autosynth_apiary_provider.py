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
from unittest.mock import patch

from autosynth.github import GitHub
from autosynth.providers import apiary


@patch.object(GitHub, "list_files")
@patch.dict(os.environ, {"GITHUB_TOKEN": "unused"})
def test_list_all_libraries(mock_list_files):
    mock_list_files.return_value = [
        {"name": "foo.v1.json"},
        {"name": "foo.v1beta1.json"},
        {"name": "bar.v2.json"},
    ]
    apis = apiary.list_apis()
    assert len(apis) == 2
    assert apis["foo"] == ["v1", "v1beta1"]
    assert apis["bar"] == ["v2"]


@patch.object(GitHub, "list_files")
@patch.dict(os.environ, {"GITHUB_TOKEN": "unused"})
def test_list_all_libraries_admin_snowflakes(mock_list_files):
    mock_list_files.return_value = [
        {"name": "admin.directory_v1.json"},
        {"name": "admin.reports_v1.json"},
    ]
    apis = apiary.list_apis()
    assert len(apis) == 1
    assert apis["admin"] == ["directory_v1", "reports_v1"]


@patch.object(GitHub, "list_files")
@patch.dict(os.environ, {"GITHUB_TOKEN": "unused"})
def test_list_all_libraries_dotted_versions(mock_list_files):
    mock_list_files.return_value = [
        {"name": "adexchangebuyer.v1.2.json"},
        {"name": "adexchangebuyer.v1.3.json"},
    ]
    apis = apiary.list_apis()
    assert len(apis) == 1
    assert apis["adexchangebuyer"] == ["v1.2", "v1.3"]


@patch.object(GitHub, "list_files")
@patch.dict(os.environ, {"GITHUB_TOKEN": "unused"})
def test_list_all_libraries_skips_non_clients(mock_list_files):
    mock_list_files.return_value = [
        {"name": "synth-metadata.json"},
        {"name": "foo.metadata"},
    ]
    apis = apiary.list_apis()
    assert len(apis) == 0
