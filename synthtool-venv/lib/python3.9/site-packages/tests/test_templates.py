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

import stat
import sys
from pathlib import Path

from synthtool.sources import templates


FIXTURES = Path(__file__).parent / "fixtures" / "node_templates" / "standard"
NODE_TEMPLATES = Path(__file__).parent.parent / "synthtool/gcp/templates/node_library"


def test_render():
    t = templates.Templates(FIXTURES)
    result = t.render("example.j2", name="world")

    assert result.name == "example"
    assert result.read_text() == "Hello, world!\n"


def test_render_with_subdir():
    t = templates.Templates(FIXTURES)
    result = t.render("example.j2", name="world", subdir="foo/bar")

    assert result.match("**/foo/bar/example")
    assert result.name == "example"
    assert result.read_text() == "Hello, world!\n"


def test_render_group():
    t = templates.TemplateGroup(FIXTURES / "group")
    result = t.render(var_a="hello", var_b="world")

    assert (result / "1.txt").read_text() == "hello\n"
    assert (result / "subdir" / "2.txt").read_text() == "world\n"


def test_render_group_with_subdir():
    t = templates.TemplateGroup(FIXTURES / "group")
    result = t.render(subdir="foo/bar", var_a="hello", var_b="world")

    assert (result / "foo/bar" / "1.txt").read_text() == "hello\n"
    assert (result / "foo/bar" / "subdir" / "2.txt").read_text() == "world\n"


def test_render_preserve_mode():
    """
    Test that rendering templates correctly preserve file modes.
    """
    source_file = FIXTURES / "executable.j2"
    source_mode = source_file.stat().st_mode

    # Verify source fixture has execute permission for USER
    if sys.platform != "win32":
        assert source_mode & stat.S_IXUSR

    t = templates.Templates(FIXTURES)
    result = t.render("executable.j2", name="executable")

    assert result.stat().st_mode == source_mode


def test_release_quality_badge():
    t = templates.Templates(NODE_TEMPLATES)
    result = t.render(
        "README.md", metadata={"repo": {"release_level": "beta"}, "samples": {}}
    ).read_text()
    assert "https://img.shields.io/badge/release%20level-beta-yellow.svg" in result
    assert "This library is considered to be in **beta**" in result


def test_syntax_highlighter():
    t = templates.Templates(NODE_TEMPLATES)
    result = t.render(
        "README.md",
        metadata={"repo": {"language": "nodejs"}, "quickstart": "const foo = 'bar'"},
    ).read_text()
    assert "```javascript" in result


def test_hide_billing():
    t = templates.Templates(NODE_TEMPLATES)

    result = t.render(
        "README.md", metadata={"repo": {"requires_billing": True, "api_id": "fooapi"}}
    ).read_text()
    assert "Enable billing for your project" in result

    result = t.render(
        "README.md", metadata={"repo": {"requires_billing": False}}
    ).read_text()
    assert "Enable billing for your project" not in result


def test_slugify():
    assert templates.slugify("Foo Bar") == "foo-bar"
    assert templates.slugify("ACL (Access Control)") == "acl-access-control"
