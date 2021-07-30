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

import os
import stat
import sys
from os.path import normpath
from pathlib import Path
import tempfile

import pytest

from synthtool import transforms
from synthtool import _tracked_paths
from . import util
import pathlib


@pytest.fixture()
def expand_path_fixtures(tmpdir):
    files = {
        "a.txt": "alpha text",
        "b.py": "beta python",
        "c.md": "see markdown",
        "dira/e.txt": "epsilon text",
        "dira/f.py": "eff python",
        "dirb/suba/g.py": "gamma python",
        "executable_file.sh": "file that should be executable but is not",
    }

    for file_name, content in files.items():
        path = tmpdir.join(normpath(file_name))
        path.write_text(content, encoding="utf-8", ensure=True)

    cwd = os.getcwd()
    os.chdir(str(tmpdir))
    yield tmpdir
    os.chdir(cwd)


@pytest.fixture()
def executable_fixtures(tmpdir):
    # Executable file
    executable = "exec.sh"
    path = tmpdir.join(executable)
    path.write_text("content", encoding="utf-8", ensure=True)
    path.chmod(0o100775)

    cwd = os.getcwd()
    os.chdir(str(tmpdir))
    yield tmpdir
    os.chdir(cwd)


@pytest.mark.parametrize(
    ["input", "expected"],
    [
        ("a.txt", ["a.txt"]),
        ("*", ["a.txt", "b.py", "c.md", "dira", "dirb", "executable_file.sh"]),
        ("*.py", ["b.py"]),
        ("**/*.py", ["b.py", normpath("dira/f.py"), normpath("dirb/suba/g.py")]),
        (
            "**/*",
            [
                "a.txt",
                "b.py",
                "c.md",
                "dira",
                normpath("dira/e.txt"),
                normpath("dira/f.py"),
                "dirb",
                normpath("dirb/suba"),
                normpath("dirb/suba/g.py"),
                "executable_file.sh",
            ],
        ),
    ],
)
def test__expand_paths(expand_path_fixtures, input, expected):
    paths = sorted([str(x) for x in transforms._expand_paths(input)])
    assert paths == expected


@pytest.mark.parametrize(
    ["input", "expected"],
    [
        ("e.txt", [normpath("dira/e.txt")]),
        ("*", [normpath("dira/e.txt"), normpath("dira/f.py")]),
    ],
)
def test__expand_paths_with_root(expand_path_fixtures, input, expected):
    paths = sorted([str(x) for x in transforms._expand_paths(input, root="dira")])
    assert paths == expected


def test__filter_files(expand_path_fixtures):
    files = sorted(
        [str(x) for x in transforms._filter_files(transforms._expand_paths("**/*"))]
    )

    assert files == [
        "a.txt",
        "b.py",
        "c.md",
        normpath("dira/e.txt"),
        normpath("dira/f.py"),
        normpath("dirb/suba/g.py"),
        "executable_file.sh",
    ]


def test__file_copy_mode(executable_fixtures):
    executable = "exec.sh"
    destination = executable_fixtures / "exec_copy.sh"

    transforms.move([executable], destination)

    # Check if destination file has execute permission for USER
    if sys.platform != "win32":
        assert destination.stat().mode & stat.S_IXUSR


def test__move_to_dest(expand_path_fixtures):
    tmp_path = Path(str(expand_path_fixtures))
    _tracked_paths.add(expand_path_fixtures)
    dest = Path(str(expand_path_fixtures / "dest"))

    transforms.move(tmp_path, dest, excludes=[normpath("dira/f.py")])

    files = sorted([str(x) for x in transforms._expand_paths("**/*", root="dest")])

    # Assert destination does not contain dira/f.py (excluded)
    assert files == [
        normpath(path)
        for path in [
            "dest/a.txt",
            "dest/b.py",
            "dest/c.md",
            "dest/dira",
            "dest/dira/e.txt",
            "dest/dirb",
            "dest/dirb/suba",
            "dest/dirb/suba/g.py",
            "dest/executable_file.sh",
        ]
    ]


def test__dont_overwrite():
    with tempfile.TemporaryDirectory() as dira, tempfile.TemporaryDirectory() as dirb:
        Path(dira).joinpath("README.md").write_text("README")
        Path(dira).joinpath("code.py").write_text("# code.py")
        Path(dira).joinpath("BUILD").write_text("bazel")

        Path(dirb).joinpath("README.md").write_text("chickens")
        Path(dirb).joinpath("code.py").write_text("# chickens")

        with util.chdir(dirb):
            _tracked_paths.add(dira)
            transforms.move(
                [Path(dira).joinpath("*")], merge=transforms.dont_overwrite(["*.md"])
            )

        # Should not have been overwritten.
        assert "chickens" == Path(dirb).joinpath("README.md").read_text()
        # Should have been overwritten.
        assert "# code.py" == Path(dirb).joinpath("code.py").read_text()
        # Should have been written.
        assert "bazel" == Path(dirb).joinpath("BUILD").read_text()


def test__move_to_dest_subdir(expand_path_fixtures):
    tmp_path = Path(str(expand_path_fixtures))
    _tracked_paths.add(expand_path_fixtures)
    dest = Path(str(expand_path_fixtures / normpath("dest/dira")))

    # Move to a different dir to make sure that move doesn't depend on the cwd
    with util.chdir(tempfile.gettempdir()):
        transforms.move(tmp_path / "dira", dest, excludes=["f.py"])

    with util.chdir(str(tmp_path)):
        files = sorted([str(x) for x in transforms._expand_paths("**/*", root="dest")])

        # Assert destination does not contain dira/f.py (excluded)
        assert files == [normpath("dest/dira"), normpath("dest/dira/e.txt")]


def test_simple_replace(expand_path_fixtures):
    count_replaced = transforms.replace(["a.txt", "b.py"], "b..a", "GA")
    assert 1 == count_replaced
    assert "alpha text" == open("a.txt", "rt").read()
    assert "GA python" == open("b.py", "rt").read()


def test_replace_one(expand_path_fixtures):
    # Lots of synth.py files pass a single string as the first argument.
    count_replaced = transforms.replace("*.py", "b..a", "GA")
    assert 1 == count_replaced
    assert "GA python" == open("b.py", "rt").read()


def test_replace_one_path(expand_path_fixtures):
    # Lots of synth.py files pass a single Path as the first argument.
    count_replaced = transforms.replace(pathlib.Path("*.py"), "b..a", "GA")
    assert 1 == count_replaced
    assert "GA python" == open("b.py", "rt").read()


def test_multi_replace(expand_path_fixtures):
    count_replaced = transforms.replace(["a.txt", "b.py"], r"(\w+)a", r"\1z")
    assert 2 == count_replaced
    assert "alphz text" == open("a.txt", "rt").read()
    assert "betz python" == open("b.py", "rt").read()


def test_replace_not_found(expand_path_fixtures):
    count_replaced = transforms.replace(["a.txt", "b.py"], r"z", r"q")
    assert 0 == count_replaced
    assert "alpha text" == open("a.txt", "rt").read()
    assert "beta python" == open("b.py", "rt").read()


def test_required_move_not_found():
    try:
        transforms.move(["non-existent"], required=True)
        assert False, "should have thrown error"
    except transforms.MissingSourceError:
        assert True


def _noop_merge(source_text: str, destination_text: str, file_path: Path) -> str:
    return source_text


def test_copy_with_merge_file_permissions(expand_path_fixtures):
    destination_file = expand_path_fixtures / "executable_file.sh"
    template_directory = Path(__file__).parent / "fixtures"
    _tracked_paths.add(template_directory)
    template = template_directory / "executable_file.sh"

    # ensure that the destination existing file already has incorrect correct
    # file permissions
    assert os.path.exists(destination_file)
    assert os.stat(destination_file).st_mode != os.stat(template).st_mode

    # Move to a different dir to make sure that move doesn't depend on the cwd
    with util.chdir(tempfile.gettempdir()):
        transforms.move(
            sources=template_directory / "executable_file.sh",
            destination=expand_path_fixtures / "executable_file.sh",
            merge=_noop_merge,
            required=True,
        )

        # ensure that the destination existing file now has the correct file permissions
        assert os.stat(destination_file).st_mode == os.stat(template).st_mode


def test_get_staging_dirs():
    with util.chdir(Path(__file__).parent / "fixtures/staging_dirs"):
        assert [path.name for path in transforms.get_staging_dirs("v1")] == ["v2", "v1"]
        assert [path.name for path in transforms.get_staging_dirs("v2")] == ["v1", "v2"]
        assert [path.name for path in transforms.get_staging_dirs()] == ["v1", "v2"]
