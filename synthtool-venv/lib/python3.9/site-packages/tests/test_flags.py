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

import autosynth.flags
import pathlib


def test_no_flags():
    synth_py = pathlib.Path(__file__).parent / "testdata" / "synth.py"
    flags = autosynth.flags.parse_flags(synth_py)
    assert not flags["AUTOSYNTH_MULTIPLE_COMMITS"]


def test_with_flags():
    synth_py = pathlib.Path(__file__).parent / "testdata" / "synth-with-flag.py"
    flags = autosynth.flags.parse_flags(synth_py)
    assert flags["AUTOSYNTH_MULTIPLE_COMMITS"]


def test_with_syntax_error():
    synth_py = pathlib.Path(__file__).parent / "testdata" / "synth-with-syntax-error-py"
    flags = autosynth.flags.parse_flags(synth_py)
    assert not flags["AUTOSYNTH_MULTIPLE_COMMITS"]
