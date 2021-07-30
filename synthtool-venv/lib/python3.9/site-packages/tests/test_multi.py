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

from autosynth import github, multi, synth
import pathlib
import requests
import tempfile
import unittest.mock
import os


def list_repositories():
    """Test implementation to allow using this module as a library config provider."""
    return [
        {"name": "test1", "repository": "googleapis/test1"},
        {"name": "test2", "repository": "googleapis/test2"},
    ]


def test_synthesize_library_success():
    config = {"name": "test1", "repository": "googleapis/test1"}
    mock_execute = unittest.mock.Mock()
    mock_execute.return_value = (0, b"success")

    with tempfile.TemporaryDirectory() as base_log_path:
        result = multi.synthesize_library(
            library=config,
            github_token="fake-github-token",
            extra_args=[],
            base_log_path=pathlib.Path(base_log_path),
            runner=mock_execute,
        )

    assert result["name"] == "test1"
    assert result["output"] == "success"
    assert result["error"] is False
    assert result["skipped"] is False


def test_synthesize_library_failure():
    config = {"name": "test1", "repository": "googleapis/test1"}

    mock_execute = unittest.mock.Mock()
    mock_execute.return_value = (1, b"something failed")

    with tempfile.TemporaryDirectory() as base_log_path:
        result = multi.synthesize_library(
            library=config,
            github_token="fake-github-token",
            extra_args=[],
            base_log_path=pathlib.Path(base_log_path),
            runner=mock_execute,
        )

    assert result["name"] == "test1"
    assert result["output"] == "something failed"
    assert result["error"] is True
    assert result["skipped"] is False


def test_synthesize_library_skip():
    config = {"name": "test1", "repository": "googleapis/test1"}

    mock_execute = unittest.mock.Mock()
    mock_execute.return_value = (synth.EXIT_CODE_SKIPPED, b"nothing changed")

    with tempfile.TemporaryDirectory() as base_log_path:
        result = multi.synthesize_library(
            library=config,
            github_token="fake-github-token",
            extra_args=[],
            base_log_path=pathlib.Path(base_log_path),
            runner=mock_execute,
        )

    assert result["name"] == "test1"
    assert result["output"] == "nothing changed"
    assert result["error"] is False
    assert result["skipped"] is True


def test_make_report():
    multi.make_report(
        "test-report",
        [
            {
                "name": "test1",
                "output": "some output data",
                "error": False,
                "skipped": False,
            },
            {
                "name": "test2",
                "output": "something failed",
                "error": True,
                "skipped": False,
            },
            {
                "name": "test3",
                "output": "something skipped",
                "error": False,
                "skipped": True,
            },
        ],
        pathlib.Path(os.getcwd()),
    )
    matching_lines = 0
    with open("sponge_log.xml", "rt") as fp:
        with open("tests/testdata/sponge-log-golden.xml", "rt") as golden:
            while True:
                matching_lines += 1
                log_line = fp.readline()
                expected = golden.readline()
                assert log_line == expected
                if not log_line:
                    break
    assert matching_lines > 0


def test_report_to_github_first_failure():
    gh = unittest.mock.Mock(github.GitHub)
    gh.list_issues.return_value = [
        {
            "title": "Unrelated issue title",
            "number": 2345,
            "url": "https://github.com/googleapis/test1/issues/2345",
        }
    ]
    gh.create_issue.return_value = {
        "url": "https://github.com/googleapis/test1/issues/1234"
    }
    multi.report_to_github(
        gh=gh,
        name="library-name",
        repository="googleapis/test1",
        error=True,
        output="some error output",
    )
    gh.list_issues.assert_called()
    gh.create_issue.assert_called()


def test_report_to_github_repeat_failure():
    gh = unittest.mock.Mock(github.GitHub)
    gh.list_issues.return_value = [
        {
            "title": "Unrelated issue title",
            "number": 2345,
            "url": "https://github.com/googleapis/test1/issues/2345",
        },
        {
            "title": "Synthesis failed for test1",
            "number": 1234,
            "url": "https://github.com/googleapis/test1/issues/1234",
        },
    ]
    multi.report_to_github(
        gh=gh,
        name="test1",
        repository="googleapis/test1",
        error=True,
        output="some error output",
    )
    gh.list_issues.assert_called()
    gh.create_issue_comment.assert_called()


def test_report_to_github_passing():
    gh = unittest.mock.Mock(github.GitHub)
    gh.list_issues.return_value = [
        {
            "title": "Unrelated issue title",
            "number": 2345,
            "url": "https://github.com/googleapis/test1/issues/2345",
        },
        {
            "title": "Synthesis failed for test1",
            "number": 1234,
            "url": "https://github.com/googleapis/test1/issues/1234",
        },
    ]
    multi.report_to_github(
        gh=gh,
        name="test1",
        repository="googleapis/test1",
        error=False,
        output="synth success",
    )
    gh.list_issues.assert_called()
    gh.create_issue_comment.assert_called()
    gh.patch_issue.assert_called_with(
        "googleapis/test1", issue_number=1234, state="closed"
    )


def test_load_config_from_file():
    config = multi.load_config("tests/testdata/multi-config.yaml")
    assert len(config) == 2
    assert config == [
        {"name": "test1", "repository": "googleapis/test1"},
        {"name": "test2", "repository": "googleapis/test2"},
    ]


def test_load_config_from_module():
    config = multi.load_config("tests.test_multi")
    assert len(config) == 2
    assert config == [
        {"name": "test1", "repository": "googleapis/test1"},
        {"name": "test2", "repository": "googleapis/test2"},
    ]


def test_load_config_missing():
    config = multi.load_config("non-existent")
    assert config is None


def test_synthesize_libraries():
    gh = unittest.mock.Mock(github.GitHub)
    gh.list_issues.return_value = []
    config = [
        {"name": "test1", "repository": "googleapis/test1"},
        {"name": "test2", "repository": "googleapis/test2"},
    ]
    mock_execute = unittest.mock.Mock()
    mock_execute.return_value = (0, b"success")

    with tempfile.TemporaryDirectory() as base_log_path:
        results = multi.synthesize_libraries(
            libraries=config,
            gh=gh,
            github_token="some-github-token",
            extra_args=[],
            base_log_path=pathlib.Path(base_log_path),
            runner=mock_execute,
        )

    assert len(results) == 2
    gh.create_issue.assert_not_called()
    gh.create_issue_comment.assert_not_called()
    gh.patch_issue.assert_not_called()


def test_synthesize_libraries_with_failures():
    gh = unittest.mock.Mock(github.GitHub)
    gh.list_issues.return_value = []
    gh.create_issue.side_effect = requests.HTTPError()

    config = [
        {"name": "test1", "repository": "googleapis/test1"},
        {"name": "test2", "repository": "googleapis/test2"},
    ]
    mock_execute = unittest.mock.Mock()
    mock_execute.side_effect = [(1, b"failure 1"), (2, b"failure 2")]

    with tempfile.TemporaryDirectory() as base_log_path:
        results = multi.synthesize_libraries(
            libraries=config,
            gh=gh,
            github_token="some-github-token",
            extra_args=[],
            base_log_path=pathlib.Path(base_log_path),
            runner=mock_execute,
        )

    assert len(results) == 2
    assert gh.create_issue.call_count == 2
    gh.create_issue_comment.assert_not_called()
    gh.patch_issue.assert_not_called()


def test_select_shard():
    config = [
        {"name": "test0", "repository": "googleapis/test0"},
        {"name": "test2", "repository": "googleapis/test2"},
        {"name": "test3", "repository": "googleapis/test3"},
        {"name": "test5", "repository": "googleapis/test5"},
        {"name": "test6", "repository": "googleapis/test6"},
        {"name": "test1", "repository": "googleapis/test1"},
        {"name": "test7", "repository": "googleapis/test7"},
        {"name": "test8", "repository": "googleapis/test8"},
        {"name": "test4", "repository": "googleapis/test4"},
        {"name": "test9", "repository": "googleapis/test9"},
    ]

    assert [{"name": "test0", "repository": "googleapis/test0"}] == multi.select_shard(
        config, "0/10"
    )
    assert [{"name": "test9", "repository": "googleapis/test9"}] == multi.select_shard(
        config, "9/10"
    )

    assert [
        {"name": "test0", "repository": "googleapis/test0"},
        {"name": "test1", "repository": "googleapis/test1"},
        {"name": "test2", "repository": "googleapis/test2"},
    ] == multi.select_shard(config, "0/3")

    assert [
        {"name": "test3", "repository": "googleapis/test3"},
        {"name": "test4", "repository": "googleapis/test4"},
        {"name": "test5", "repository": "googleapis/test5"},
    ] == multi.select_shard(config, "1/3")

    assert [
        {"name": "test6", "repository": "googleapis/test6"},
        {"name": "test7", "repository": "googleapis/test7"},
        {"name": "test8", "repository": "googleapis/test8"},
        {"name": "test9", "repository": "googleapis/test9"},
    ] == multi.select_shard(config, "2/3")
