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

from pathlib import Path
import re


VERSION_SETTER_REGEX = re.compile(r'^\s+VERSION = "[\d\.]+"', flags=re.MULTILINE)
COPYRIGHT_REGEX = re.compile(r"^# Copyright (\d{4}) Google LLC$", flags=re.MULTILINE)


def global_merge(src: str, dest: str, path: Path):
    """Merge function for the Ruby microgenerator.

    This should be used for most merges of newly generated and existing files.
    It does the following:
    * Preserves destination CHANGELOG.md files (detected by name)
    * Preserves destination version.rb files (detected by name and content)
    * Preserves copyright year from destination Rakefile and *.rb files

    Args:
        src: Source file content from gapic
        dest: Destination file content
        path: Destination file path

    Returns:
        The merged file content.
    """
    if path.name == "CHANGELOG.md":
        return dest

    if path.name == "version.rb" and VERSION_SETTER_REGEX.search(dest):
        return dest

    if path.name.endswith(".rb") or path.name == "Rakefile":
        m = re.search(COPYRIGHT_REGEX, dest)
        if m:
            return re.sub(
                COPYRIGHT_REGEX, f"# Copyright {m.group(1)} Google LLC", src, 1
            )

    return src
