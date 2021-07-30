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

import os
import shutil
import tempfile
import xml.etree.ElementTree as ET
import yaml
from pathlib import Path
from synthtool.languages import java
import requests_mock
import pytest
from . import util

FIXTURES = Path(__file__).parent / "fixtures"
TEMPLATES_PATH = Path(__file__).parent.parent / "synthtool" / "gcp" / "templates"

SAMPLE_METADATA = """
<metadata>
  <groupId>com.google.cloud</groupId>
  <artifactId>libraries-bom</artifactId>
  <versioning>
    <latest>3.3.0</latest>
    <release>3.3.0</release>
    <versions>
      <version>1.0.0</version>
      <version>1.1.0</version>
      <version>1.1.1</version>
      <version>1.2.0</version>
      <version>2.0.0</version>
      <version>2.1.0</version>
      <version>2.2.0</version>
      <version>2.2.1</version>
      <version>2.3.0</version>
      <version>2.4.0</version>
      <version>2.5.0</version>
      <version>2.6.0</version>
      <version>2.7.0</version>
      <version>2.7.1</version>
      <version>2.8.0</version>
      <version>2.9.0</version>
      <version>3.0.0</version>
      <version>3.1.0</version>
      <version>3.1.1</version>
      <version>3.2.0</version>
      <version>3.3.0</version>
    </versions>
    <lastUpdated>20191218182827</lastUpdated>
  </versioning>
</metadata>
"""


def test_version_from_maven_metadata():
    assert "3.3.0" == java.version_from_maven_metadata(SAMPLE_METADATA)


def test_latest_maven_version():
    with requests_mock.Mocker() as m:
        m.get(
            "https://repo1.maven.org/maven2/com/google/cloud/libraries-bom/maven-metadata.xml",
            text=SAMPLE_METADATA,
        )
        assert "3.3.0" == java.latest_maven_version(
            group_id="com.google.cloud", artifact_id="libraries-bom"
        )


def test_working_common_templates():
    def assert_valid_xml(file):
        try:
            ET.parse(file)
        except ET.ParseError:
            pytest.fail(f"unable to parse XML: {file}")

    def assert_valid_yaml(file):
        with open(file, "r") as stream:
            try:
                yaml.safe_load(stream)
            except yaml.YAMLError:
                pytest.fail(f"unable to parse YAML: {file}")

    with util.copied_fixtures_dir(FIXTURES / "java_templates" / "standard") as workdir:
        # generate the common templates
        java.common_templates(template_path=TEMPLATES_PATH)
        assert os.path.isfile("renovate.json")

        # lint xml, yaml files
        # use os.walk because glob ignores hidden directories
        for (dirpath, _, filenames) in os.walk(workdir):
            for file in filenames:
                (_, ext) = os.path.splitext(file)
                if ext == ".xml":
                    assert_valid_xml(os.path.join(dirpath, file))
                elif ext == ".yaml" or ext == ".yml":
                    assert_valid_yaml(os.path.join(dirpath, file))


def test_remove_method():
    with tempfile.TemporaryDirectory() as tempdir:
        shutil.copyfile(
            "tests/testdata/SampleClass.java", tempdir + "/SampleClass.java"
        )

        java.remove_method(tempdir + "/SampleClass.java", "public static void foo()")
        java.remove_method(tempdir + "/SampleClass.java", "public void asdf()")
        assert_matches_golden(
            "tests/testdata/SampleClassGolden.java", tempdir + "/SampleClass.java"
        )


def test_copy_and_rename_method():
    with tempfile.TemporaryDirectory() as tempdir:
        shutil.copyfile(
            "tests/testdata/SampleClass.java", tempdir + "/SampleClass.java"
        )

        java.copy_and_rename_method(
            tempdir + "/SampleClass.java", "public static void foo()", "foo", "foobar"
        )
        java.copy_and_rename_method(
            tempdir + "/SampleClass.java", "public void asdf()", "asdf", "xyz"
        )
        assert_matches_golden(
            "tests/testdata/SampleCopyMethodGolden.java", tempdir + "/SampleClass.java"
        )


def test_deprecate_method():
    # with tempfile.TemporaryDirectory() as tempdir:
    if True:
        tempdir = tempfile.mkdtemp()
        shutil.copyfile(
            "tests/testdata/SampleDeprecateClass.java",
            tempdir + "/SampleDeprecateClass.java",
        )
        DEPRECATION_WARNING = """This method will be removed in the next major version.\nUse {{@link #{new_method}()}} instead"""
        ADDITIONAL_COMMENT = """{new_method} has the same functionality as foobar."""
        java.deprecate_method(
            tempdir + "/SampleDeprecateClass.java",
            "public void foo(String bar)",
            DEPRECATION_WARNING.format(new_method="sample"),
        )

        # adding a comment when a javadoc and annotation already exists
        java.deprecate_method(
            tempdir + "/SampleDeprecateClass.java",
            "public void bar(String bar)",
            DEPRECATION_WARNING.format(new_method="sample"),
        )
        java.deprecate_method(
            tempdir + "/SampleDeprecateClass.java",
            "public void cat(String bar)",
            ADDITIONAL_COMMENT.format(new_method="sample"),
        )

        assert_matches_golden(
            "tests/testdata/SampleDeprecateMethodGolden.java",
            tempdir + "/SampleDeprecateClass.java",
        )


def test_fix_proto_license():
    with tempfile.TemporaryDirectory() as tempdir:
        temppath = Path(tempdir).resolve()
        os.mkdir(temppath / "src")
        shutil.copyfile(
            "tests/testdata/src/foo/FooProto.java", temppath / "src/FooProto.java"
        )

        java.fix_proto_headers(temppath)
        assert_matches_golden(
            "tests/testdata/FooProtoGolden.java", temppath / "src/FooProto.java"
        )


def test_fix_proto_license_idempotent():
    with tempfile.TemporaryDirectory() as tempdir:
        temppath = Path(tempdir).resolve()
        os.mkdir(temppath / "src")
        shutil.copyfile(
            "tests/testdata/src/foo/FooProto.java", temppath / "src/FooProto.java"
        )

        # run the header fix twice
        java.fix_proto_headers(temppath)
        java.fix_proto_headers(temppath)
        assert_matches_golden(
            "tests/testdata/FooProtoGolden.java", temppath / "src/FooProto.java"
        )


def test_fix_grpc_license():
    with tempfile.TemporaryDirectory() as tempdir:
        temppath = Path(tempdir).resolve()
        os.mkdir(temppath / "src")
        shutil.copyfile(
            "tests/testdata/src/foo/FooGrpc.java", temppath / "src/FooGrpc.java"
        )

        java.fix_grpc_headers(temppath)
        assert_matches_golden(
            "tests/testdata/FooGrpcGolden.java", temppath / "src/FooGrpc.java"
        )


def test_fix_grpc_license_idempotent():
    with tempfile.TemporaryDirectory() as tempdir:
        temppath = Path(tempdir).resolve()
        os.mkdir(temppath / "src")
        shutil.copyfile(
            "tests/testdata/src/foo/FooGrpc.java", temppath / "src/FooGrpc.java"
        )

        # run the header fix twice
        java.fix_grpc_headers(temppath)
        java.fix_grpc_headers(temppath)
        assert_matches_golden(
            "tests/testdata/FooGrpcGolden.java", temppath / "src/FooGrpc.java"
        )


def test_release_please_handle_releases():
    with util.copied_fixtures_dir(
        FIXTURES / "java_templates" / "release-please-update"
    ):
        # generate the common templates
        java.common_templates(template_path=TEMPLATES_PATH)

        assert os.path.isfile(".github/release-please.yml")
        with open(".github/release-please.yml") as fp:
            assert (
                fp.read()
                == """branches:
- branch: 1.127.12-sp
  bumpMinorPreMajor: true
  handleGHRelease: true
  releaseType: java-lts
bumpMinorPreMajor: true
handleGHRelease: true
releaseType: java-yoshi
"""
            )


def assert_matches_golden(expected, actual):
    matching_lines = 0
    with open(actual, "rt") as fp:
        with open(expected, "rt") as golden:
            while True:
                matching_lines += 1
                log_line = fp.readline()
                expected = golden.readline()
                assert repr(log_line) == repr(expected)
                if not log_line:
                    break
    assert matching_lines > 0
