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

from synthtool.gcp import partials
from . import util

FIXTURES = Path(__file__).parent / "fixtures" / "node_templates" / "standard"


def test_readme_partials():
    with util.chdir(FIXTURES):
        data = partials.load_partials()
        # should have populated introduction from partial.
        assert "objects to users via direct download" in data["introduction"]


def test_readme_partials_not_found():
    data = partials.load_partials(["non-existent.yaml"])
    assert len(data) == 0
