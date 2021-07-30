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

import filecmp
import os
import pathlib
import tempfile
from pathlib import Path
from unittest import TestCase
from unittest.mock import patch

import pytest

import synthtool as s
from synthtool.languages import node
from . import util

FIXTURES = Path(__file__).parent / "fixtures"
TEMPLATES = Path(__file__).parent.parent / "synthtool" / "gcp" / "templates"


def test_quickstart_metadata_with_snippet():
    with util.chdir(FIXTURES / "node_templates" / "standard"):
        metadata = node.template_metadata()

        # should have loaded the special quickstart sample (ignoring header).
        assert "ID of the Cloud Bigtable instance" in metadata["quickstart"]
        assert "limitations under the License" not in metadata["quickstart"]

        assert isinstance(metadata["samples"], list)

        # should have a link to the quickstart in the samples
        sample_names = list(map(lambda sample: sample["file"], metadata["samples"]))
        assert "samples/quickstart.js" in sample_names


def test_quickstart_metadata_without_snippet():
    with util.chdir(FIXTURES / "node_templates" / "no_quickstart_snippet"):
        metadata = node.template_metadata()

        # should not have populated the quickstart for the README
        assert not metadata["quickstart"]

        assert isinstance(metadata["samples"], list)

        # should not have a link to the quickstart in the samples
        sample_names = list(map(lambda sample: sample["file"], metadata["samples"]))
        assert "samples/quickstart.js" not in sample_names


def test_no_samples():
    # use a non-nodejs template directory
    with util.chdir(FIXTURES):
        metadata = node.template_metadata()

        # should not have populated the quickstart for the README
        assert not metadata["quickstart"]

        assert isinstance(metadata["samples"], list)
        assert len(metadata["samples"]) == 0


def test_extract_clients_no_file():
    index_ts_path = pathlib.Path(
        FIXTURES / "node_templates" / "index_samples" / "no_exist_index.ts"
    )

    with pytest.raises(FileNotFoundError):
        clients = node.extract_clients(index_ts_path)
        assert not clients


def test_extract_single_clients():
    index_ts_path = pathlib.Path(
        FIXTURES / "node_templates" / "index_samples" / "single_index.ts"
    )

    clients = node.extract_clients(index_ts_path)

    assert len(clients) == 1
    assert clients[0] == "TextToSpeechClient"


def test_extract_multiple_clients():
    index_ts_path = pathlib.Path(
        FIXTURES / "node_templates" / "index_samples" / "multiple_index.ts"
    )

    clients = node.extract_clients(index_ts_path)

    assert len(clients) == 2
    assert clients[0] == "StreamingVideoIntelligenceServiceClient"
    assert clients[1] == "VideoIntelligenceServiceClient"


def test_generate_index_ts():
    # use a non-nodejs template directory
    with util.chdir(FIXTURES / "node_templates" / "index_samples"):
        node.generate_index_ts(["v1", "v1beta1"], "v1")
        generated_index_path = pathlib.Path(
            FIXTURES / "node_templates" / "index_samples" / "src" / "index.ts"
        )
        sample_index_path = pathlib.Path(
            FIXTURES / "node_templates" / "index_samples" / "sample_index.ts"
        )
        assert filecmp.cmp(generated_index_path, sample_index_path)


def test_generate_index_ts_empty_versions():
    # use a non-nodejs template directory
    with util.chdir(FIXTURES / "node_templates" / "index_samples"):
        with pytest.raises(AttributeError) as err:
            node.generate_index_ts([], "v1")
            assert "can't be empty" in err.args


def test_generate_index_ts_invalid_default_version():
    # use a non-nodejs template directory
    with util.chdir(FIXTURES / "node_templates" / "index_samples"):
        versions = ["v1beta1"]
        default_version = "v1"

        with pytest.raises(AttributeError) as err:
            node.generate_index_ts(versions, default_version)
            assert f"must contain default version {default_version}" in err.args


def test_generate_index_ts_no_clients():
    # use a non-nodejs template directory
    with util.chdir(FIXTURES / "node_templates" / "index_samples"):
        versions = ["v1", "v1beta1", "invalid_index"]
        default_version = "invalid_index"

        with pytest.raises(AttributeError) as err:
            node.generate_index_ts(versions, default_version)
            assert (
                f"No client is exported in the default version's({default_version}) index.ts ."
                in err.args
            )


class TestPostprocess(TestCase):
    @patch("synthtool.shell.run")
    def test_install(self, shell_run_mock):
        node.install()
        calls = shell_run_mock.call_args_list
        assert any(["npm install" in " ".join(call[0][0]) for call in calls])

    @patch("synthtool.shell.run")
    def test_fix(self, shell_run_mock):
        node.fix()
        calls = shell_run_mock.call_args_list
        assert any(["npm run fix" in " ".join(call[0][0]) for call in calls])

    @patch("synthtool.shell.run")
    def test_compile_protos(self, shell_run_mock):
        node.compile_protos()
        calls = shell_run_mock.call_args_list
        assert any(["npx compileProtos src" in " ".join(call[0][0]) for call in calls])

    @patch("synthtool.shell.run")
    def test_postprocess_gapic_library(self, shell_run_mock):
        node.postprocess_gapic_library()
        calls = shell_run_mock.call_args_list
        assert any(["npm install" in " ".join(call[0][0]) for call in calls])
        assert any(["npm run fix" in " ".join(call[0][0]) for call in calls])
        assert any(["npx compileProtos src" in " ".join(call[0][0]) for call in calls])


# postprocess_gapic_library_hermetic() must be mocked because it depends on node modules
# present in the docker image but absent while running unit tests.
@patch("synthtool.languages.node.postprocess_gapic_library_hermetic")
def test_owlbot_main(hermetic_mock):
    with util.copied_fixtures_dir(FIXTURES / "nodejs-dlp"):
        # just confirm it doesn't throw an exception.
        node.owlbot_main(TEMPLATES)


@pytest.fixture
def nodejs_dlp():
    """chdir to a copy of nodejs-dlp-with-staging."""
    with util.copied_fixtures_dir(FIXTURES / "nodejs-dlp-with-staging") as workdir:
        yield workdir


@patch("synthtool.languages.node.postprocess_gapic_library_hermetic")
def test_owlbot_main_with_staging(hermetic_mock, nodejs_dlp):
    original_text = open(
        FIXTURES / "nodejs-dlp-with-staging" / "src" / "index.ts", "rt"
    ).read()
    node.owlbot_main(TEMPLATES)
    # confirm index.ts was overwritten by template-generated index.ts.
    staging_text = open(
        FIXTURES
        / "nodejs-dlp-with-staging"
        / "owl-bot-staging"
        / "v2"
        / "src"
        / "index.ts",
        "rt",
    ).read()
    text = open("./src/index.ts", "rt").read()
    assert staging_text != text
    assert original_text != text


@patch("synthtool.languages.node.postprocess_gapic_library_hermetic")
def test_owlbot_main_with_staging_index_from_staging(hermetic_mock, nodejs_dlp):
    node.owlbot_main(
        TEMPLATES,
        staging_excludes=["README.md", "package.json"],
        templates_excludes=["src/index.ts"],
    )
    # confirm index.ts was overwritten by staging index.ts.
    staging_text = open(
        FIXTURES
        / "nodejs-dlp-with-staging"
        / "owl-bot-staging"
        / "v2"
        / "src"
        / "index.ts",
        "rt",
    ).read()
    text = open("./src/index.ts", "rt").read()
    assert staging_text == text


@patch("synthtool.languages.node.postprocess_gapic_library_hermetic")
def test_owlbot_main_with_staging_ignore_index(hermetic_mock, nodejs_dlp):
    original_text = open(
        FIXTURES / "nodejs-dlp-with-staging" / "src" / "index.ts", "rt"
    ).read()
    node.owlbot_main(TEMPLATES, templates_excludes=["src/index.ts"])
    # confirm index.ts was overwritten by staging index.ts.
    text = open("./src/index.ts", "rt").read()
    assert original_text == text


@patch("synthtool.languages.node.postprocess_gapic_library_hermetic")
def test_owlbot_main_with_staging_patch_staging(hermetic_mock, nodejs_dlp):
    def patch(library: Path):
        s.replace(library / "src" / "index.ts", "import", "export")

    node.owlbot_main(
        TEMPLATES,
        staging_excludes=["README.md", "package.json"],
        templates_excludes=["src/index.ts"],
        patch_staging=patch,
    )
    # confirm index.ts was overwritten by staging index.ts.
    staging_text = open(
        FIXTURES
        / "nodejs-dlp-with-staging"
        / "owl-bot-staging"
        / "v2"
        / "src"
        / "index.ts",
        "rt",
    ).read()
    text = open("./src/index.ts", "rt").read()
    assert "import * as v2" in staging_text
    assert "export * as v2" not in staging_text
    assert "export * as v2" in text


def test_detect_versions_src():
    temp_dir = Path(tempfile.mkdtemp())
    src_dir = temp_dir / "src"
    for v in ("v1", "v2", "v3"):
        os.makedirs(src_dir / v)

    with util.chdir(temp_dir):
        versions = node.detect_versions()
        assert ["v1", "v2", "v3"] == versions


def test_detect_versions_staging():
    temp_dir = Path(tempfile.mkdtemp())
    staging_dir = temp_dir / "owl-bot-staging"
    for v in ("v1", "v2", "v3"):
        os.makedirs(staging_dir / v)

    versions = node.detect_versions(staging_dir)
    assert ["v1", "v2", "v3"] == versions


def test_detect_versions_dir_not_found():
    temp_dir = Path(tempfile.mkdtemp())

    versions = node.detect_versions(temp_dir / "does-not-exist")
    assert [] == versions


def test_detect_versions_with_default():
    temp_dir = Path(tempfile.mkdtemp())
    src_dir = temp_dir / "src"
    vs = ("v1", "v2", "v3")
    for v in vs:
        os.makedirs(src_dir / v)

    with util.chdir(temp_dir):
        versions = node.detect_versions(default_version="v1")
        assert ["v2", "v3", "v1"] == versions
        versions = node.detect_versions(default_version="v2")
        assert ["v1", "v3", "v2"] == versions
        versions = node.detect_versions(default_version="v3")
        assert ["v1", "v2", "v3"] == versions
