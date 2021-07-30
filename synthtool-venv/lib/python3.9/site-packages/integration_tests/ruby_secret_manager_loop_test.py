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

import integration_tests.util
import unittest.mock
import autosynth.flags


def test():
    with unittest.mock.patch("autosynth.flags.parse_flags") as parse_flags:
        flags = autosynth.flags.default_flags()
        flags.update({autosynth.flags.AUTOSYNTH_MULTIPLE_COMMITS: True})
        parse_flags.return_value = flags
        git_log_path = integration_tests.util.generate(
            "googleapis/google-cloud-ruby",
            "7082ed08ffdb268aed659b72f68f1513bb3d51fb",
            "google-cloud-secret_manager-v1",
        )
        integration_tests.util.assert_git_logs_match(
            git_log_path,
            integration_tests.util.get_testdata_file_path(
                "ruby-secret-manager-loop.log"
            ),
        )
