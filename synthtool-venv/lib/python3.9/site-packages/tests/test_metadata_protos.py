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

import google.protobuf.json_format

from synthtool.protos import metadata_pb2


def test_basic_operation():
    metadata = metadata_pb2.Metadata()
    metadata.sources.add(
        git=metadata_pb2.GitSource(
            name="test name", remote="test remote", sha="test sha"
        )
    )

    assert metadata.sources[0].git.name == "test name"


def test_to_json():
    metadata = metadata_pb2.Metadata()
    metadata.sources.add(
        git=metadata_pb2.GitSource(
            name="test name", remote="test remote", sha="test sha"
        )
    )

    jsonified = google.protobuf.json_format.MessageToJson(metadata)

    assert (
        jsonified
        == """\
{
  "sources": [
    {
      "git": {
        "name": "test name",
        "remote": "test remote",
        "sha": "test sha"
      }
    }
  ]
}"""
    )

    print(jsonified)
