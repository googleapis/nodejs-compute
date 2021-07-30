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

from pathlib import Path


from synthtool import _tracked_paths


FIXTURES = Path(__file__).parent / "fixtures"


def test_deep_paths():
    parent = FIXTURES / "parent"
    deep_path = FIXTURES / "parent" / "child" / "grandchild"
    deep_item = deep_path / "thing.txt"

    _tracked_paths.add(parent)
    _tracked_paths.add(deep_path)

    assert _tracked_paths.relativize(deep_item) == Path("thing.txt")
