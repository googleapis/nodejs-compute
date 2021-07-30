# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from abc import ABC, abstractmethod
import typing
import datetime


class AbstractSourceVersion(ABC):
    @abstractmethod
    def apply(self, preconfig: typing.Dict) -> None:
        """Update the preconfig to use this version of the source.

        Will likely also change stuff in the local file system, like
        checking out a specific version of a git repository.

        Arguments:
            preconfig {typing.Dict} -- The preconfig that will be passed to synthtool.
        """
        pass

    @abstractmethod
    def get_comment(self) -> str:
        """Get a comment to include in the pull request body for this version.

        The comment can be one or many lines.
        Returns:
            str -- The comment to include in the pull request body.
        """
        pass

    @abstractmethod
    def get_source_description(self) -> str:
        """Get text describing the source for this version.  For example,
        'Git repo https://github.com/googleapis/nodejs-vision'

        The resulting text is used in the message when there are changes
        that cannot be attributed to any source.

        Returns:
            str -- a human-readable description of the source.
        """
        pass

    @abstractmethod
    def get_source_name(self) -> str:
        """Get the name of the source.  It's used in branch names.

        Because it's used in branch names, the source name should not contain
        charactars that are illegal in git branch names.
        Returns:
            str -- The source's name.
        """
        pass

    @abstractmethod
    def get_timestamp(self) -> datetime.datetime:
        """Get the time at which the change was committed."""
        pass
