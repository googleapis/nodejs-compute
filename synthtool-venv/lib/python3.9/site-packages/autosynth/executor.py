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

from autosynth.log import logger
import subprocess
from typing import List


def run(command: List[str], **args):
    """Wrapper around subprocess.run which logs the command."""
    logger.debug(f"Running: {' '.join(command)}")
    return subprocess.run(command, **args)


def check_call(command: List[str], **args):
    """Wrapper around subprocess.check_call which logs the command."""
    logger.debug(f"Running: {' '.join(command)}")
    subprocess.check_call(command, **args)
