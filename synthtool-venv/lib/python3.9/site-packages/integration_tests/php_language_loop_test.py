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

import autosynth
import integration_tests.util


def test():
    with integration_tests.util.ModifiedEnvironment(
        {autosynth.flags.AUTOSYNTH_MULTIPLE_COMMITS: "TRUE"}
    ):
        git_log_path = integration_tests.util.generate(
            "googleapis/google-cloud-php",
            "d5ccc000fbf4d11a66efdafacacd98ad84f18f74",
            "Language/",
        )
        integration_tests.util.assert_git_logs_match(
            git_log_path,
            integration_tests.util.get_testdata_file_path("php-language-loop.log"),
        )
