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

from autosynth.change_pusher import build_pr_body, _parse_trailers
from integration_tests import util


def test_build_pr_body_with_synth_log():
    synth_log = "The best pull request ever!"
    pr_body = build_pr_body(synth_log)
    assert pr_body.find(synth_log) > -1


def test_build_pr_body_with_kokoro_build_id():
    with util.ModifiedEnvironment({"KOKORO_BUILD_ID": "42"}):
        pr_body = build_pr_body("")
        assert (
            pr_body.find("https://source.cloud.google.com/results/invocations/42") > -1
        )


def test_build_pr_body_with_synth_log_and_kokoro_build_id():
    with util.ModifiedEnvironment({"KOKORO_BUILD_ID": "42"}):
        synth_log = "A great pull request."
        pr_body = build_pr_body(synth_log)
        assert (
            pr_body.find("https://source.cloud.google.com/results/invocations/42") > -1
        )
        assert pr_body.find(synth_log) > -1


def test_build_pr_body_with_very_long_synth_log():
    with util.ModifiedEnvironment({"KOKORO_BUILD_ID": "42"}):
        synth_log = "abcdefghi\n" * 10000
        pr_body = build_pr_body(synth_log)
        assert (
            pr_body.find("https://source.cloud.google.com/results/invocations/42") > -1
        )
        assert pr_body.find("abcdefghi") > -1
        assert pr_body.find("[LOG TRUNCATED]") > -1
        assert len(pr_body) < 60000


def test_build_pr_body_with_synth_trailers():
    synth_log = "synth log"
    pr_body = build_pr_body(synth_log, "a: b\nc: d")
    assert pr_body.find("a: b") > -1
    assert pr_body.find("c: d") > -1


def test_parse_trailers():
    text = """
Source-Author: Google APIs <noreply@google.com>
Source-Date: Mon Apr 13 12:05:23 2020 -0700
Source-Repo: googleapis/googleapis
Source-Sha: 4d61e1cb40184a7ad63ef37b1813f6608718674a
Source-Link: https://github.com/googleapis/googleapis/commit/4d61e1cb40184a7ad63ef37b1813f6608718674a

* Removing erroneous comment, a la https://github.com/googleapis/java-speech/pull/103
PiperOrigin-RevId: 296332968

Source-Author: Google APIs <noreply@google.com>
Source-Date: Thu Feb 20 17:19:15 2020 -0800
Source-Repo: googleapis/googleapis
Source-Sha: 17567c4a1ef0a9b50faa87024d66f8acbb561089
Source-Link: https://github.com/googleapis/googleapis/commit/17567c4a1ef0a9b50faa87024d66f8acbb561089

* changes without context
        autosynth cannot find the source of changes triggered by earlier changes in this
        repository, or by version upgrades to tools such as linters.
""".strip()
    trailers = _parse_trailers(text)
    golden_trailers = "Source-Link: https://github.com/googleapis/googleapis/commit/4d61e1cb40184a7ad63ef37b1813f6608718674a\nPiperOrigin-RevId: 296332968\nSource-Link: https://github.com/googleapis/googleapis/commit/17567c4a1ef0a9b50faa87024d66f8acbb561089"
    assert trailers == golden_trailers
