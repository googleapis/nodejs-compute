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

import pathlib
import tempfile
import unittest.mock

import autosynth.git_source


def test_enumerate_versions_for_generated_repo():
    metadata_path = pathlib.Path(__file__).parent / "testdata" / "synth.metadata"
    versions = autosynth.git_source.enumerate_versions_for_working_repo(
        metadata_path, []
    )
    assert 1 == len(versions)


def test_compose_comment_with_github_source_creates_link():
    comment = autosynth.git_source._compose_comment(
        "https://github.com/googleapis/nodejs-language.git",
        "e38448803ac56cb9a65c631ade0c7e74358dca80",
        "language\n\nthe-log",
    )
    assert (
        "https://github.com/googleapis/nodejs-language/commit/e38448803ac56cb9a65c631ade0c7e74358dca80"
        in comment
    )


def test_compose_comment_with_github_source_minus_suffix_creates_link():
    comment = autosynth.git_source._compose_comment(
        "https://github.com/googleapis/nodejs-language",
        "e38448803ac56cb9a65c631ade0c7e74358dca80",
        "language\n\nthe-log",
    )
    assert (
        "https://github.com/googleapis/nodejs-language/commit/e38448803ac56cb9a65c631ade0c7e74358dca80"
        in comment
    )


def test_compose_comment_with_other_source():
    comment = autosynth.git_source._compose_comment(
        "sso://devrel/googleapis/nodejs-language",
        "e38448803ac56cb9a65c631ade0c7e74358dca80",
        "language\n\nthe-log",
    )
    assert (
        "nodejs-language/commit/e38448803ac56cb9a65c631ade0c7e74358dca80" not in comment
    )


def test_compose_comment_contains_all_details():
    comment = autosynth.git_source._compose_comment(
        "sso://devrel/googleapis/nodejs-language",
        "e38448803ac56cb9a65c631ade0c7e74358dca80",
        "russian\n\nthe-log",
    )
    assert "russian" in comment
    assert "sso://devrel/googleapis/nodejs-language" in comment
    assert "the-log" in comment


def test_compose_comment_with_github_source_contains_all_details():
    comment = autosynth.git_source._compose_comment(
        "https://github.com/googleapis/nodejs-language",
        "e38448803ac56cb9a65c631ade0c7e74358dca80",
        "russian\n\nthe-log",
    )
    assert "russian" in comment
    assert "https://github.com/googleapis/nodejs-language" in comment
    assert "e38448803ac56cb9a65c631ade0c7e74358dca80" in comment
    assert "the-log" in comment


_metadata = {
    "sources": [
        {
            "generator": {
                "name": "artman",
                "version": "0.44.4",
                "dockerImage": "googleapis/artman@sha256:19e945954fc960a4bdfee6cb34695898ab21a8cf0bac063ee39b91f00a1faec8",
            }
        },
        {
            "git": {
                "name": "secret-manager",
                "remote": "https://github.com/googleapis/nodejs-secret-manager.git",
                "sha": "e46f761cd6ec15a9e3d5ed4ff321a4bcba8e8585",
                "internalRef": "293710856",
                "localPath": "/tmp/secret-manager",
            }
        },
        {
            "git": {
                "name": "googleapis",
                "remote": "https://github.com/googleapis/googleapis.git",
                "sha": "a46f761cd6ec15a9e3d5ed4ff321a4bcba8e8585",
                "internalRef": "293710857",
                "localPath": "/tmp/googleapis",
            }
        },
    ]
}


def test_enumerate_four_versions_from_two_git_sources():
    with unittest.mock.patch(
        "autosynth.git_source.enumerate_versions_for_source"
    ) as ev, tempfile.TemporaryDirectory() as temp_dir:
        # Create mocks
        v1 = unittest.mock.Mock(autosynth.abstract_source.AbstractSourceVersion)
        v2 = unittest.mock.Mock(autosynth.abstract_source.AbstractSourceVersion)
        ev.return_value = [v1, v2]

        # Call enumerate versions
        versions = autosynth.git_source.enumerate_versions(
            _metadata["sources"], temp_dir
        )

        # Confirm expectations
        ev.assert_any_call(_metadata["sources"][1]["git"], temp_dir)
        ev.assert_any_call(_metadata["sources"][2]["git"], temp_dir)
        assert 2 == ev.call_count
        assert [[v1, v2], [v1, v2]] == versions


def test_enumerate_no_versions_from_two_git_sources():
    with unittest.mock.patch(
        "autosynth.git_source.enumerate_versions_for_source"
    ) as ev, tempfile.TemporaryDirectory() as temp_dir:
        # Create mocks
        ev.return_value = []

        # Call enumerate versions
        versions = autosynth.git_source.enumerate_versions(
            _metadata["sources"], temp_dir
        )

        # Confirm expectations
        ev.assert_any_call(_metadata["sources"][1]["git"], temp_dir)
        ev.assert_any_call(_metadata["sources"][2]["git"], temp_dir)
        assert 2 == ev.call_count
        assert [] == versions


_metadata_with_duplicate_source = {
    "sources": [
        {
            "git": {
                "name": "googleapis",
                "remote": "https://github.com/googleapis/googleapis.git",
                "sha": "a46f761cd6ec15a9e3d5ed4ff321a4bcba8e8585",
                "internalRef": "293710857",
                "localPath": "/tmp/googleapis",
            }
        },
        {
            "git": {
                "name": "googleapis",
                "remote": "https://github.com/googleapis/googleapis.git",
                "sha": "a46f761cd6ec15a9e3d5ed4ff321a4bcba8e8585",
                "internalRef": "293710857",
                "localPath": "/tmp/googleapis",
            }
        },
    ]
}


def test_enumerate_versions_with_duplicate_sources():
    with unittest.mock.patch(
        "autosynth.git_source.enumerate_versions_for_source"
    ) as ev, tempfile.TemporaryDirectory() as temp_dir:
        # Create mocks
        v1 = unittest.mock.Mock(autosynth.abstract_source.AbstractSourceVersion)
        v2 = unittest.mock.Mock(autosynth.abstract_source.AbstractSourceVersion)
        ev.return_value = [v1, v2]

        # Call enumerate versions
        versions = autosynth.git_source.enumerate_versions(
            _metadata_with_duplicate_source["sources"], temp_dir
        )

        # Confirm expectations
        ev.assert_any_call(
            _metadata_with_duplicate_source["sources"][0]["git"], temp_dir
        )
        assert 1 == ev.call_count
        assert [[v1, v2]] == versions


_metadata_with_functionally_duplicate_source = {
    "sources": [
        {
            "git": {
                "name": "googleapis",
                "remote": "https://github.com/googleapis/googleapis.git",
                "sha": "a46f761cd6ec15a9e3d5ed4ff321a4bcba8e8585",
                "internalRef": "293710857",
                "localPath": "/tmp/googleapis",
            }
        },
        {
            "git": {
                "name": "googleapis",
                "remote": "https://github.com/googleapis/googleapis.git",
                "sha": "a46f761cd6ec15a9e3d5ed4ff321a4bcba8e8585",
                "internalRef": "293710857",
                "localPath": "/tmp/googleapis",
                # extra data that can be ignored
                "log": "some extra log message",
            }
        },
    ]
}


def test_enumerate_versions_with_functionally_duplicate_sources():
    with unittest.mock.patch(
        "autosynth.git_source.enumerate_versions_for_source"
    ) as ev, tempfile.TemporaryDirectory() as temp_dir:
        # Create mocks
        v1 = unittest.mock.Mock(autosynth.abstract_source.AbstractSourceVersion)
        v2 = unittest.mock.Mock(autosynth.abstract_source.AbstractSourceVersion)
        ev.return_value = [v1, v2]

        # Call enumerate versions
        versions = autosynth.git_source.enumerate_versions(
            _metadata_with_functionally_duplicate_source["sources"], temp_dir
        )

        # Confirm expectations
        ev.assert_any_call(
            _metadata_with_functionally_duplicate_source["sources"][0]["git"], temp_dir
        )
        assert 1 == ev.call_count
        assert [[v1, v2]] == versions


def test_strip_pr_number():
    strip = autosynth.git_source._strip_pr_number
    assert "fix bugs" == strip("fix bugs (#244)")
    # variations that should not be stripped
    assert "fix bugs (#)" == strip("fix bugs (#)")
    assert "fix bugs #244" == strip("fix bugs #244")
    assert "fix (#244) bugs" == strip("fix (#244) bugs")
