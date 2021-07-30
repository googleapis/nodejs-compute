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


def test():
    git_log_path = integration_tests.util.generate(
        "googleapis/google-cloud-ruby",
        "9fbc94c17cae022cdef367798e0325732f91189c",
        "google-cloud-kms/",
    )
    integration_tests.util.assert_git_logs_match(
        git_log_path,
        integration_tests.util.get_testdata_file_path("ruby-kms-golden.log"),
    )
