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
from synthtool.gcp import snippets
from . import util

FIXTURES = Path(__file__).parent / "fixtures"


def test_load_snippets():
    with util.chdir(FIXTURES):
        all_snippets = snippets.all_snippets(["snippets/*.java", "snippets/*.xml"])
        assert len(all_snippets) == 2

        assert (
            all_snippets["monitoring_quickstart"]
            == """
public class MonitoringQuickstartSample {
    // do something
}

"""
        )
        assert (
            all_snippets["monitoring_install_with_bom"]
            == """<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>com.google.cloud</groupId>
      <artifactId>libraries-bom</artifactId>
      <version>3.5.0</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>

<dependencies>
  <dependency>
    <groupId>com.google.cloud</groupId>
    <artifactId>google-cloud-monitoring</artifactId>
  </dependency>
</dependencies>
"""
        )


def test_interleaving_snippets():
    with util.chdir(FIXTURES):
        all_snippets = snippets.all_snippets_from_file("snippets/interleaved.js")
        assert len(all_snippets) == 2

        assert (
            all_snippets["interleave_snippet_1"]
            == """var line1 = 1;
var line2 = 2;
"""
        )

        assert (
            all_snippets["interleave_snippet_2"]
            == """var line2 = 2;
var line3 = 3;
"""
        )


def test_interleaving_snippets_with_exclude():
    with util.chdir(FIXTURES):
        all_snippets = snippets.all_snippets_from_file(
            "snippets/interleaved_with_exclude.js"
        )
        assert len(all_snippets) == 1

        assert (
            all_snippets["snippet_1"]
            == """var line1 = 1;
var line3 = 3;
"""
        )


def test_nested_snippets():
    with util.chdir(FIXTURES):
        all_snippets = snippets.all_snippets_from_file("snippets/nested.js")
        assert len(all_snippets) == 2

        assert (
            all_snippets["nested_snippet_1"]
            == """var line1 = 1;
var line2 = 2;
var line3 = 3;
"""
        )

        assert (
            all_snippets["nested_snippet_2"]
            == """var line2 = 2;
"""
        )


def test_non_existent_file():
    with util.chdir(FIXTURES):
        all_snippets = snippets.all_snippets_from_file("snippets/non-existent-file.foo")
        assert len(all_snippets) == 0


def test_reused_tag():
    with util.chdir(FIXTURES):
        all_snippets = snippets.all_snippets_from_file("snippets/reused.js")
        assert len(all_snippets) == 1
        assert (
            all_snippets["snippet_1"]
            == """var line1 = 1;
var line3 = 3;
"""
        )
