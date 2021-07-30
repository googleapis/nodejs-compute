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

import pathlib
from synthtool.languages import ruby

DUMMY_DIR = pathlib.Path(__file__).parent


def test_global_merge_passes_ordinary_files():
    src = "Hello,\nworld!"
    dest = "Ruby\nrocks!"
    path = DUMMY_DIR / "hello.rb"
    result = ruby.global_merge(src, dest, path)
    assert result == "Hello,\nworld!"


def test_global_merge_preserves_changelog():
    src = "Hello,\nworld!"
    dest = "Ruby\nrocks!"
    path = DUMMY_DIR / "CHANGELOG.md"
    result = ruby.global_merge(src, dest, path)
    assert result == "Ruby\nrocks!"


def test_global_merge_preserves_version():
    src = "Hello,\nworld!"
    dest = 'Ruby\nrocks!\n  VERSION = "1.2.3".freeze\n'
    path = DUMMY_DIR / "version.rb"
    result = ruby.global_merge(src, dest, path)
    assert result == 'Ruby\nrocks!\n  VERSION = "1.2.3".freeze\n'


def test_global_merge_recognizes_version_syntax():
    src = "Hello,\nworld!"
    dest = 'Ruby\nrocks!\n  NOT_VERSION = "1.2.3".freeze\n'
    path = DUMMY_DIR / "version.rb"
    result = ruby.global_merge(src, dest, path)
    assert result == "Hello,\nworld!"


def test_global_merge_preserves_ruby_copyright():
    src = "Hello,\nworld!\n# Copyright 2021 Google LLC\nOkay"
    dest = "Ruby\nrocks!\n# Copyright 2020 Google LLC\nYeah!"
    path = DUMMY_DIR / "hello.rb"
    result = ruby.global_merge(src, dest, path)
    assert result == "Hello,\nworld!\n# Copyright 2020 Google LLC\nOkay"


def test_global_merge_preserves_rakefile_copyright():
    src = "Hello,\nworld!\n# Copyright 2021 Google LLC\nOkay"
    dest = "Ruby\nrocks!\n# Copyright 2020 Google LLC\nYeah!"
    path = DUMMY_DIR / "Rakefile"
    result = ruby.global_merge(src, dest, path)
    assert result == "Hello,\nworld!\n# Copyright 2020 Google LLC\nOkay"
