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

import datetime
import json
import os
import pathlib
import re
import subprocess
import sys
import tempfile
import typing
import unittest.mock
from unittest.mock import call

import pytest  # type:ignore
from tests.util import make_working_repo

import autosynth.abstract_source
import autosynth.synth
from autosynth import git
from autosynth.change_pusher import (
    AbstractChangePusher,
    AbstractPullRequest,
    SquashingChangePusher,
)
from autosynth.synthesizer import AbstractSynthesizer
from integration_tests import util


class WriteFile:
    """Mock source version that writes content to a file."""

    def __init__(self, path: str, content: str):
        self.path = path
        self.content = content
        self.apply_call_history: typing.List[typing.Dict] = []

    def apply(self, preconfig: typing.Dict) -> None:
        # Also set a value in the preconfig.
        self.apply_call_history.append(dict(preconfig))
        preconfig[self.path] = self.content
        with open(self.path, "wt") as f:
            f.write(self.content)

    def get_comment(self) -> str:
        return f"Wrote {self.content} to {self.path}."

    def __repr__(self):
        return f"WriteFile({repr(self.path)}, {repr(self.content)})"


class NoChange:
    """Mock source version that causes no change in generated code."""

    def apply(self, preconfig: typing.Dict) -> None:
        pass

    def get_comment(self) -> str:
        return "no change"


class Failed:
    """Mock source version that causes synthtool to fail."""

    def apply(self, preconfig: typing.Dict) -> None:
        raise subprocess.CalledProcessError(-1, "synthesize", "", "")

    def get_comment(self) -> str:
        return "failed"


class MockSynthesizer(AbstractSynthesizer):
    """A place to set the action of synthesize()."""

    def __init__(self):
        self._actions = []

    def add_action(self, action):
        self._actions.append(action)

    def synthesize(
        self, logfile: pathlib.Path, environ: typing.Mapping[str, str] = None
    ) -> str:
        actions = self._actions
        self._actions = []
        for action in actions:
            action()
        return "synth log"


class CompiledVersion(autosynth.abstract_source.AbstractSourceVersion):
    """Takes a list of mock versions, and applies them all in its apply function."""

    _timestamp = 0

    def __init__(
        self,
        versions: typing.List[typing.Any],
        synthesizer: MockSynthesizer,
        source_name: str,
    ):
        self.versions = versions
        self.synthesizer = synthesizer
        self.synthesize_call_count = 0
        self.source_name = self.source_description = source_name

    def apply(self, preconfig: typing.Dict) -> None:
        """Applies all my mock versions."""

        def synthesize():
            self.synthesize_call_count += 1
            for version in self.versions[0:-1]:
                try:
                    version.apply(preconfig)
                except subprocess.CalledProcessError:
                    pass
            self.versions[-1].apply(preconfig)

        self.synthesizer.add_action(synthesize)

    def get_comment(self) -> str:
        return self.versions[-1].get_comment()

    def get_source_description(self) -> str:
        return self.source_description

    def get_source_name(self) -> str:
        return self.source_name

    def get_timestamp(self) -> datetime.datetime:
        CompiledVersion._timestamp += 1
        return datetime.datetime.fromtimestamp(CompiledVersion._timestamp)


def compile_histories(
    histories: typing.List[typing.List[typing.Any]], synthesizer: MockSynthesizer,
) -> typing.Sequence[typing.Sequence[CompiledVersion]]:
    """Takes a list of mock source versions, and returns a list of source versions."""
    # Split the history so it looks like it came from two sources.
    compiled_histories = [
        [
            CompiledVersion(history[0:i], synthesizer, f"source{source_number + 1}")
            for i in range(1, len(history) + 1)
        ]
        for source_number, history in enumerate(histories)
    ]
    return compiled_histories


def test_synthesize_loop_with_empty_change_history():
    with tempfile.TemporaryDirectory() as temp_dir:
        x = autosynth.synth.SynthesizeLoopToolbox(
            [], "test", temp_dir, "synth.metadata", ""
        )
        commit_count = autosynth.synth.synthesize_loop(
            x, False, MockChangePusher(), MockSynthesizer,
        )
        assert 0 == commit_count


class MockPullRequest(AbstractPullRequest):
    def add_labels(self, labels: typing.Sequence[str]) -> None:
        pass


class MockChangePusher(AbstractChangePusher):
    def push_changes(
        self, commit_count: int, branch: str, pr_title: str = "", synth_log: str = ""
    ) -> None:
        return MockPullRequest()

    def check_if_pr_already_exists(self, branch) -> bool:
        return False


class SynthesizeLoopFixture:
    """Test fixture for synthesize_loop() tests."""

    def __init__(self, temp_dir: str):
        self.temp_dir = temp_dir
        self.change_pusher = unittest.mock.Mock(MockChangePusher)
        self.change_pusher.check_if_pr_already_exists.return_value = False
        self.synthesizer = MockSynthesizer()

    def synthesize_loop(
        self,
        source_versions: typing.Sequence[
            typing.Sequence[autosynth.abstract_source.AbstractSourceVersion]
        ],
        multiple_prs: bool = False,
    ) -> int:
        x = autosynth.synth.SynthesizeLoopToolbox(
            source_versions, "test", self.temp_dir, "synth.metadata", ""
        )
        return autosynth.synth.synthesize_loop(
            x, multiple_prs, self.change_pusher, self.synthesizer,
        )


@pytest.fixture
def synthesize_loop_fixture() -> typing.Generator[SynthesizeLoopFixture, None, None]:
    with tempfile.TemporaryDirectory() as temp_dir, tempfile.TemporaryDirectory() as working_repo, util.OsChdirContext(
        working_repo
    ):
        # Create a git repo with a README.
        subprocess.check_call(["git", "init", "."])
        with open("README.md", "wt") as readme:
            readme.write("Well done.")
        git.commit_all_changes("Added Readme")
        subprocess.check_call(["git", "checkout", "-b", "test"])
        # Create a synthesizer.
        yield SynthesizeLoopFixture(temp_dir)


def test_synthesize_loop_with_realistic_change_history(
    synthesize_loop_fixture: SynthesizeLoopFixture,
):
    synthesize_loop_with_realistic_change_history(
        synthesize_loop_fixture, False, "mock-synth-golden.log"
    )


def test_synthesize_loop_with_realistic_change_history_multiple_prs(
    synthesize_loop_fixture: SynthesizeLoopFixture,
):
    synthesize_loop_with_realistic_change_history(
        synthesize_loop_fixture, True, "mock-synth-golden-multiple-prs.log"
    )
    pusher = synthesize_loop_fixture.change_pusher
    calls = pusher.mock_calls
    golden_calls = [
        call.check_if_pr_already_exists("test-source1"),
        call.push_changes(
            3,
            "test-source1",
            "[CHANGE ME] Re-generated to pick up changes from source1.",
        ),
        call.push_changes().add_labels(["context: partial"]),
        call.check_if_pr_already_exists("test-source2"),
        call.push_changes(
            3,
            "test-source2",
            "[CHANGE ME] Re-generated to pick up changes from source2.",
        ),
        call.push_changes().add_labels(["context: partial"]),
    ]
    assert golden_calls == calls


def test_synthesize_loop_with_realistic_change_history_squash_prs(
    synthesize_loop_fixture: SynthesizeLoopFixture,
):
    pusher = synthesize_loop_fixture.change_pusher
    synthesize_loop_fixture.change_pusher = SquashingChangePusher(pusher)
    synthesize_loop_with_realistic_change_history(
        synthesize_loop_fixture, True, "mock-synth-golden-squash-prs.log"
    )
    calls = pusher.mock_calls
    golden_calls = [
        call.check_if_pr_already_exists("test-source1"),
        call.push_changes(
            1,
            "test-source1",
            "[CHANGE ME] Re-generated to pick up changes from source1.",
            "",
        ),
        call.push_changes().add_labels(["context: partial"]),
        call.check_if_pr_already_exists("test-source2"),
        call.push_changes(
            1,
            "test-source2",
            "[CHANGE ME] Re-generated to pick up changes from source2.",
            "",
        ),
        call.push_changes().add_labels(["context: partial"]),
    ]
    assert golden_calls == calls


def synthesize_loop_with_realistic_change_history(
    synthesize_loop_fixture: SynthesizeLoopFixture, multiple_prs: bool, golden_file: str
):
    change_history = [
        [
            WriteFile("a.txt", "a"),
            NoChange(),
            NoChange(),
            NoChange(),
            WriteFile("b.txt", "b"),
            WriteFile("a.txt", "z"),
        ],
        [
            NoChange(),
            Failed(),
            Failed(),
            WriteFile("c.txt", "c"),
            WriteFile("c.txt", "c-more"),
            NoChange(),
        ],
    ]
    source_versions = compile_histories(
        change_history, synthesize_loop_fixture.synthesizer
    )
    # Call synthesize_loop.
    synthesize_loop_fixture.synthesize_loop(source_versions, multiple_prs)
    # Confirm the git log looks like the golden log.
    handle, git_log_path = tempfile.mkstemp(".log")
    with os.fdopen(handle, "w") as git_log:
        subprocess.run(
            ["git", "log", "-p", "--no-decorate"], stdout=git_log,
        )
    golden_log_path = str(pathlib.Path(__file__).parent / "testdata" / golden_file)
    util.assert_git_logs_match(git_log_path, golden_log_path)
    # Confirm that binary search yielded some benefit: for at least one version
    # synthesize was never called.
    flat_source_versions = [v for group in source_versions for v in group]
    versions_never_synthesized = [
        v for v in flat_source_versions if v.synthesize_call_count == 0
    ]
    assert len(versions_never_synthesized) > 0


def test_synthesize_loop_with_no_changes(
    synthesize_loop_fixture: SynthesizeLoopFixture,
):
    change_history = [
        [
            NoChange(),
            NoChange(),
            NoChange(),
            NoChange(),
            # These failures are effectively ignored.  If they were not
            # ignored, then a single broken version would break autosynth
            # forever.  In other words, if the most recent version succeeds, then
            # autosynth must succeed, regardless of history.
            # If the most recent version fails, then autosynth must fail.
            Failed(),
            NoChange(),
        ],
        [Failed(), NoChange()],
    ]
    source_versions = compile_histories(
        change_history, synthesize_loop_fixture.synthesizer
    )
    commit_count = synthesize_loop_fixture.synthesize_loop(source_versions)
    assert 0 == commit_count


def test_synthesize_loop_with_synthesize_failure(
    synthesize_loop_fixture: SynthesizeLoopFixture,
):
    change_history = [[Failed(), Failed()]]
    source_versions = compile_histories(
        change_history, synthesize_loop_fixture.synthesizer
    )
    try:
        synthesize_loop_fixture.synthesize_loop(source_versions)
        assert False, "Expected an exception to be thrown."
    except subprocess.CalledProcessError:
        pass


def test_synthesize_loop_with_new_synth_metadata(
    synthesize_loop_fixture: SynthesizeLoopFixture,
):
    change_history = [
        [WriteFile("synth.metadata", "{}")],
        [WriteFile("synth.metadata", '{"a": "b"}')],
    ]
    source_versions = compile_histories(
        change_history, synthesize_loop_fixture.synthesizer
    )
    commit_count = synthesize_loop_fixture.synthesize_loop(source_versions)
    assert 1 == commit_count


def test_synthesize_loop_preconfig(synthesize_loop_fixture: SynthesizeLoopFixture):
    a = WriteFile("a.txt", "a")
    b = WriteFile("b.txt", "b")
    c = WriteFile("c.txt", "c")

    change_history = [[a, b, c]]
    source_versions = compile_histories(
        change_history, synthesize_loop_fixture.synthesizer
    )
    synthesize_loop_fixture.synthesize_loop(source_versions)
    for preconfig in a.apply_call_history:
        assert {} == preconfig
    for preconfig in b.apply_call_history:
        assert {"a.txt": "a"} == preconfig
    for preconfig in c.apply_call_history:
        assert {"a.txt": "a", "b.txt": "b"} == preconfig


def test_synthesize_loop_track_obsolete_files(
    synthesize_loop_fixture: SynthesizeLoopFixture,
):
    # Create a synth.metadata with empty generatedFiles.
    metadata = {"generatedFiles": []}
    with open("synth.metadata", "wt") as synth_metadata:
        synth_metadata.write(json.dumps(metadata))
    git.commit_all_changes("Added synth.metadata with empty generatedFiles.")

    # Create a generated change that populate synth.metadata's generatedFiles.
    metadata = {"generatedFiles": ["a.txt"]}
    write_metadata = WriteFile("synth.metadata", json.dumps(metadata))

    # Invoke the synthesize loop.
    change_history = [[NoChange(), write_metadata]]
    source_versions = compile_histories(
        change_history, synthesize_loop_fixture.synthesizer
    )
    synthesize_loop_fixture.synthesize_loop(source_versions)

    # Confirm the synth loop pushed a change.
    calls = synthesize_loop_fixture.change_pusher.mock_calls
    assert call.push_changes(1, "test", "chore: start tracking obsolete files") in calls


def test_synthesize_loop_skips_multiple_existing_prs(
    synthesize_loop_fixture: SynthesizeLoopFixture,
):
    change_history = [
        [WriteFile("a.txt", "a")],
        [WriteFile("b.txt", "b")],
    ]
    source_versions = compile_histories(
        change_history, synthesize_loop_fixture.synthesizer
    )
    # Call synthesize_loop.
    synthesize_loop_fixture.change_pusher.check_if_pr_already_exists.return_value = True
    synthesize_loop_fixture.synthesize_loop(source_versions, True)
    calls = synthesize_loop_fixture.change_pusher.mock_calls
    golden_calls = [
        call.check_if_pr_already_exists("test-source1"),
        call.check_if_pr_already_exists("test-source2"),
    ]
    assert golden_calls == calls


def test_synthesize_loop_uses_single_commit_title_for_pr_title(
    synthesize_loop_fixture: SynthesizeLoopFixture,
):
    change_history = [
        [NoChange()],
        [NoChange(), WriteFile("a.txt", "a")],
    ]
    source_versions = compile_histories(
        change_history, synthesize_loop_fixture.synthesizer
    )
    # Call synthesize_loop.
    synthesize_loop_fixture.synthesize_loop(source_versions, True)
    calls = synthesize_loop_fixture.change_pusher.mock_calls
    golden_calls = [
        call.check_if_pr_already_exists("test-source1"),
        call.check_if_pr_already_exists("test-source2"),
        call.push_changes(1, "test-source2", "Wrote a to a.txt."),
        call.push_changes().add_labels(["context: full"]),
    ]
    assert golden_calls == calls


def test_synthesize_loop_always_pushes_something_when_latest_version_succeeds(
    synthesize_loop_fixture: SynthesizeLoopFixture,
):
    histories = [
        [Failed(), WriteFile("a.txt", "a")],
        [Failed(), WriteFile("b.txt", "b")],
    ]
    source_versions = compile_histories(histories, synthesize_loop_fixture.synthesizer)
    # Synthesize loop will throw an exception.
    try:
        synthesize_loop_fixture.synthesize_loop(source_versions, True)
        assert False, "Expected an exception to be thrown."
    except Exception:
        pass
    # But the loop still should have pushed a change.
    synthesize_loop_fixture.change_pusher.push_changes.assert_called()


class SimpleSynthesizer(AbstractSynthesizer):
    """Invokes synth.py and does nothing more."""

    def synthesize(
        self, logfile: pathlib.Path, environ: typing.Mapping[str, str] = None
    ) -> str:
        subprocess.check_call([sys.executable, "synth.py"])
        return "synth log"


# Ignore these links in git logs because their commit hashes constantly change.
_ignore_line_regexps = [
    re.compile(x, re.DOTALL)
    for x in [
        r"\s*https://github.com/googleapis/nodejs-vision/commit/.*",
        r"\s*Source-Link:.*",
        r"\s*Source-Sha:.*",
        r"\s*Source-Date:.*",
    ]
]


def log_lines_match(a: str, b: str) -> bool:
    """Also ignores changes in commit links."""
    if util.log_lines_match(a, b):
        return True
    for regexp in _ignore_line_regexps:
        if regexp.match(a) and regexp.match(b):
            return True
    return False


def test_working_repo():
    """Tests the tricky case where the working_repo is the one being iterated over."""
    with tempfile.TemporaryDirectory() as working_dir, util.OsChdirContext(
        working_dir
    ), tempfile.TemporaryDirectory() as temp_dir:
        make_working_repo(working_dir)
        metadata_path = os.path.join(working_dir, "synth.metadata")
        synthesizer = SimpleSynthesizer()
        versions = autosynth.git_source.enumerate_versions_for_working_repo(
            metadata_path, []
        )
        subprocess.check_call(["git", "checkout", "-b", "test"])
        toolbox = autosynth.synth.SynthesizeLoopToolbox(
            [versions], "test", temp_dir, metadata_path, ""
        )
        assert 1 == autosynth.synth.synthesize_loop(
            toolbox, False, MockChangePusher(), synthesizer
        )
        assert_git_log_matches(
            pathlib.Path(__file__).parent / "testdata" / "test-working-repo-golden.log"
        )


def assert_git_log_matches(golden_log_path: pathlib.Path):
    handle, git_log_path = tempfile.mkstemp(".log")
    log_cmd = ["git", "log", "-p", "--no-decorate"]
    log_cmd.extend(["--", ".", ":(exclude)synth.metadata"])
    with os.fdopen(handle, "w") as git_log:
        subprocess.run(log_cmd, stdout=git_log)
    util.assert_git_logs_match(git_log_path, str(golden_log_path), log_lines_match)


def test_pull_request_interleaved_with_commit():
    """Test a the case where:
    1.  A pull request is generated.
    2.  A commit unrelated to the pull request gets merged.
    3.  The pull request gets merged.
    4.  Regenerate and create a new pull request.  Autosynth should be able to
        identify the changes triggered by #2.
    """
    with tempfile.TemporaryDirectory() as working_dir, util.OsChdirContext(
        working_dir
    ), tempfile.TemporaryDirectory() as temp_dir:
        text = make_working_repo(working_dir)
        metadata_path = os.path.join(working_dir, "synth.metadata")
        synthesizer = SimpleSynthesizer()
        versions = autosynth.git_source.enumerate_versions_for_working_repo(
            metadata_path, []
        )
        subprocess.check_call(["git", "branch", "test"])

        # Write version d in master.
        working_path = pathlib.Path(working_dir)
        subprocess.check_call(["git", "checkout", "master"])
        text = text.replace('"c\\n"', '"d\\n"')
        (working_path / "synth.py").write_text(text)
        subprocess.check_call(["git", "commit", "-am", "d"])

        subprocess.check_call(["git", "checkout", "test"])
        toolbox = autosynth.synth.SynthesizeLoopToolbox(
            [versions], "test", temp_dir, metadata_path, ""
        )
        autosynth.synth.synthesize_loop(toolbox, False, MockChangePusher(), synthesizer)

        # Merge in the pull request.
        subprocess.check_call(["git", "checkout", "master"])
        subprocess.check_call(["git", "merge", "--squash", "-X", "theirs", "test"])
        subprocess.check_call(["git", "commit", "-am", "merged PR"])

        # Create a second pull request.
        subprocess.check_call(["git", "checkout", "-b", "test2"])
        with open(metadata_path, "rb") as metadata_file:
            metadata: typing.Dict[str, typing.Any] = json.load(metadata_file)
        versions = autosynth.git_source.enumerate_versions_for_working_repo(
            metadata_path, metadata.get("sources", [])
        )
        toolbox = autosynth.synth.SynthesizeLoopToolbox(
            [versions], "test2", temp_dir, metadata_path, ""
        )
        autosynth.synth.synthesize_loop(toolbox, False, MockChangePusher(), synthesizer)

        assert_git_log_matches(
            pathlib.Path(__file__).parent
            / "testdata"
            / "test-pull-request-interleaved-with-commit.log"
        )
