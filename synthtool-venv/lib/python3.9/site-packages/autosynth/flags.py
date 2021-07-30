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

import ast
import typing
import copy
import pathlib

# Global flags that may be set in synth.py files.
AUTOSYNTH_MULTIPLE_COMMITS = "AUTOSYNTH_MULTIPLE_COMMITS"
AUTOSYNTH_MULTIPLE_PRS = "AUTOSYNTH_MULTIPLE_PRS"
_SYNTH_PY_FLAGS = {
    AUTOSYNTH_MULTIPLE_COMMITS: False,
    AUTOSYNTH_MULTIPLE_PRS: False,
}


def default_flags() -> typing.Dict[str, typing.Any]:
    """Returns all the default flag settings.

    The returned dictionary is a new copy so the caller can modify it.
    """
    return copy.copy(_SYNTH_PY_FLAGS)


def parse_flags(synth_py_path="synth.py") -> typing.Dict[str, typing.Any]:
    """Extracts flags from a synth.py file.

    Keyword Arguments:
        synth_py_path {str or Path} -- Path to synth.py (default: {"synth.py"})

    Returns:
        typing.Dict[str, typing.Any] -- A map of all possible flags.  Flags not
          found in synth.py will be set to their default value.
    """
    flags = copy.copy(_SYNTH_PY_FLAGS)
    path = pathlib.Path(synth_py_path)
    try:
        module = ast.parse(path.read_text())
    except SyntaxError:
        return flags  # Later attempt to execute synth.py will give a clearer error message.

    for child in ast.iter_child_nodes(module):
        if isinstance(child, ast.Assign):
            for target in child.targets:
                if isinstance(target, ast.Name) and target.id in flags:
                    flags[target.id] = ast.literal_eval(child.value)
    return flags
