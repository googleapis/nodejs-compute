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
from synthtool.gcp import samples
from . import util

FIXTURES = Path(__file__).parent / "fixtures"


def test_load_node_samples():
    with util.chdir(FIXTURES / "node_templates" / "standard"):
        all_samples = samples.all_samples(["samples/*.js"])

        # should have loaded samples.
        assert all_samples[3]["title"] == "Requester Pays"
        assert all_samples[3]["file"] == "samples/requesterPays.js"
        assert len(all_samples) == 4

        # should have included additional meta-information provided.
        assert all_samples[0]["title"] == "Metadata Example 1"
        assert all_samples[0]["usage"] == "node hello-world.js"
        assert all_samples[1]["title"] == "Metadata Example 2"
        assert all_samples[1]["usage"] == "node goodnight-moon.js"
