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

import base64
from typing import (
    Dict,
    Generator,
    List,
    Optional,
    Sequence,
    Union,
    cast,
)

import requests

from autosynth.log import logger

_GITHUB_ROOT: str = "https://api.github.com"


class GitHub:
    def __init__(self, token: str) -> None:
        self.session: requests.Session = requests.Session()
        self.session.headers.update(
            {
                "Accept": "application/vnd.github.v3+json",
                "Authorization": f"Bearer {token}",
            }
        )

    def list_pull_requests(self, repository: str, **kwargs) -> Sequence[Dict]:
        """List all pull requests for a repository.

        See: https://developer.github.com/v3/pulls/#list-pull-requests

        Arguments:
            repository {str} -- GitHub repository with the format [owner]/[repo]
            kwargs -- List filters

        Returns:
            Sequence[Dict] - List of parsed pull request json data

        Throws:
            ValueError if the response does not contain valid json (unlikely).
            HttpError if the server returns an error code.
        """
        url = f"{_GITHUB_ROOT}/repos/{repository}/pulls"
        response = self.session.get(url, params=kwargs)
        return cast(List[Dict], _get_json_or_raise_exception(response))

    def create_pull_request(
        self, repository: str, branch: str, title: str, body: str = None
    ) -> Dict:
        """Open a pull request.

        See: https://developer.github.com/v3/pulls/#create-a-pull-request

        Arguments:
            repository {str} -- GitHub repository with the format [owner]/[repo]
            branch {str} --
            title {str} --
            body {Optional[str]} --

        Returns:
            Dict -- Parsed pull request json data

        Throws:
            ValueError if the response does not contain valid json (unlikely).
            HttpError if the server returns an error code.
        """
        url = f"{_GITHUB_ROOT}/repos/{repository}/pulls"
        response = self.session.post(
            url,
            json={
                "title": title,
                "body": body,
                "head": branch,
                "base": "master",
                "maintainer_can_modify": True,
            },
        )
        return cast(Dict, _get_json_or_raise_exception(response))

    def update_pull_request(
        self,
        repository: str,
        pull_number: int,
        title: str = None,
        body: str = None,
        state=None,
    ) -> Dict:
        """Update an existing pull request.

        See: https://developer.github.com/v3/pulls/#update-a-pull-request
        Any of title, body, and state can be null, if only a subset are being updated.

        Arguments:
            repository {str} -- GitHub repository with the format [owner]/[repo]
            pull_number {int} -- The number of the pull request.
            title {Optional[str]} -- The new title
            body {Optional[str]} -- The new body.
            state {Optional[str]} -- "open" or "closed"

        Returns:
            Dict -- Parsed pull request json data

        Throws:
            ValueError if the response does not contain valid json (unlikely).
            HttpError if the server returns an error code.
        """
        url = f"{_GITHUB_ROOT}/repos/{repository}/pulls/{pull_number}"
        json = {
            "title": title,
            "body": body,
            "state": state,
        }
        # Remove fields that are not being updated.
        json = dict(
            [(key, value) for (key, value) in json.items() if value is not None]
        )

        response = self.session.patch(url, json=json)
        return cast(Dict, _get_json_or_raise_exception(response))

    def get_tree(self, repository: str, tree_sha: str = "master") -> Sequence[Dict]:
        """Returns a single tree using the SHA1 value for that tree.

        See: https://developer.github.com/v3/git/trees/#get-a-tree

        Arguments:
            repository {str} -- GitHub repository with the format [owner]/[repo]
            tree_sha {str} -- SHA of the tree to fetch. Uses master by default.

        Throws:
            ValueError if the response does not contain valid json (unlikely).
            HttpError if the server returns an error code.
        """
        url = f"{_GITHUB_ROOT}/repos/{repository}/git/trees/{tree_sha}"
        response = self.session.get(url, params={})

        return cast(List[Dict], _get_json_or_raise_exception(response))

    def get_contents(self, repository: str, path: str, ref: str = None) -> bytes:
        """Fetch the raw file contents for a file and return a bytestring.

        See: https://developer.github.com/v3/repos/contents/#get-contents

        Arguments:
            repository {str} -- GitHub repository with the format [owner]/[repo]
            path {str} -- Path to the file
            ref {Optional[str]} -- Git ref to use if provided. Uses master by default.

        Returns:
            bytes -- Raw contents of the file.

        Throws:
            ValueError if the response does not contain valid json (unlikely).
            HttpError if the server returns an error code.
        """
        url = f"{_GITHUB_ROOT}/repos/{repository}/contents/{path}"
        response = self.session.get(url, params={"ref": ref})

        json = cast(Dict, _get_json_or_raise_exception(response))
        return base64.b64decode(json["content"])

    def list_files(self, repository: str, path: str, ref: str = None) -> Sequence[Dict]:
        """List all files in a given repository path.

        Arguments:
            repository {str} -- GitHub repository with the format [owner]/[repo]
            path {str} -- Path to the file
            ref {Optional[str]} -- Git ref to use if provided. Uses master by default.

        Returns:
            List[Dict] -- List of file objects. See https://developer.github.com/v3/repos/contents/#response-if-content-is-a-directory

        Throws:
            ValueError if the response does not contain valid json (unlikely).
            HttpError if the server returns an error code.
        """
        url = f"{_GITHUB_ROOT}/repos/{repository}/contents/{path}"
        response = self.session.get(url, params={"ref": ref})
        try:
            return cast(List[Dict], _get_json_or_raise_exception(response))
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                return []
            else:
                raise

    def check_for_file(self, repository: str, path: str, ref: str = None) -> bool:
        """Check to see if a file exists in a given repository.

        Arguments:
            repository {str} -- GitHub repository with the format [owner]/[repo]
            path {str} -- Path to the file
            ref {Optional[str]} -- Git ref to use if provided. Uses master by default.

        Returns:
            bool -- True if the file exists.

        """
        url = f"{_GITHUB_ROOT}/repos/{repository}/contents/{path}"
        response = self.session.head(url, params={"ref": ref})

        if response.status_code == 200:
            return True
        else:
            return False

    def list_issues(self, repository: str, **kwargs) -> Generator[Dict, None, None]:
        """Return a Generator that iterates over all issues in the repository.

        See: https://developer.github.com/v3/issues/#list-repository-issues

        Arguments:
            repository {str} -- GitHub repository with the format [owner]/[repo]

        Returns:
            Generator that yields issue dictionary values

        Throws:
            ValueError if the response does not contain valid json (unlikely).
            HttpError if the server returns an error code.
        """
        url = f"{_GITHUB_ROOT}/repos/{repository}/issues"

        while url:
            response = self.session.get(url, params=kwargs)
            items = cast(List[Dict], _get_json_or_raise_exception(response))
            for item in items:
                yield item

            url = response.links.get("next", {}).get("url")

    def create_issue(
        self, repository: str, title: str, body: str, labels: Sequence[str]
    ) -> Dict:
        """Create an issue on a repository.

        See: https://developer.github.com/v3/issues/#create-an-issue

        Arguments:
            repository {str} -- GitHub repository with the format [owner]/[repo]
            title {str} -- Issue title
            body {str} -- Issue body
            labels {Sequence[str]} -- Labels to attach to the created issue

        Returns:
            Dict -- Parsed issue json

        Throws:
            ValueError if the response does not contain valid json (unlikely).
            HttpError if the server returns an error code.
        """
        url = f"{_GITHUB_ROOT}/repos/{repository}/issues"
        response = self.session.post(
            url, json={"title": title, "body": body, "labels": labels}
        )
        return cast(Dict, _get_json_or_raise_exception(response))

    def patch_issue(self, repository: str, issue_number: int, **kwargs) -> Dict:
        """Patch values on an issue

        See: https://developer.github.com/v3/issues/#update-an-issue

        Arguments:
            repository {str} -- GitHub repository with the format [owner]/[repo]
            issue_number {int} -- Issue number to update
            kwargs -- Additional field values to update on the issue.

        Returns:
            Dict -- Parsed issue json

        Throws:
            ValueError if the response does not contain valid json (unlikely).
            HttpError if the server returns an error code.
        """
        url = f"{_GITHUB_ROOT}/repos/{repository}/issues/{issue_number}"
        response = self.session.patch(url, json=kwargs)
        return cast(Dict, _get_json_or_raise_exception(response))

    def create_issue_comment(
        self, repository: str, issue_number: int, comment: str
    ) -> Dict:
        """Add a comment to an existing issue.

        See: https://developer.github.com/v3/issues/comments/#create-a-comment

        Arguments:
            repository {str} -- GitHub repository with the format [owner]/[repo]
            issue_number {int} -- Issue number to update
            comment {str} -- Comment body

        Returns:
            Dict -- Parsed comment json

        Throws:
            ValueError if the response does not contain valid json (unlikely).
            HttpError if the server returns an error code.
        """
        repo_url = f"{_GITHUB_ROOT}/repos/{repository}"
        url = f"{repo_url}/issues/{issue_number}/comments"
        response = self.session.post(url, json={"body": comment})
        response.raise_for_status()
        return response.json()

    def replace_issue_labels(
        self, repository: str, issue_number: str, labels: Sequence[str]
    ) -> List[Dict]:
        """Replace all labels on an issue.

        See: https://developer.github.com/v3/issues/labels/#replace-all-labels-for-an-issue

        Arguments:
            repository {str} -- GitHub repository with the format [owner]/[repo]
            issue_number {int} -- Issue number to update
            labels {Sequence[str]} -- Labels to attach to the created issue

        Returns:
            List[Dict] -- List of parsed label json

        Throws:
            ValueError if the response does not contain valid json (unlikely).
            HttpError if the server returns an error code.
        """
        url = f"{_GITHUB_ROOT}/repos/{repository}/issues/{issue_number}/labels"
        response = self.session.put(url, json={"labels": labels})

        return cast(List[Dict], _get_json_or_raise_exception(response))

    def update_pull_labels(
        self, pull: dict, add: Sequence[str] = None, remove: Sequence[str] = None
    ) -> List[Dict]:
        """Updates labels for a github pull, adding and removing labels as needed.

        Arguments:
            pull {dict} - Parsed pull request json data
            add {Sequence[str]} - Labels to add
            remove {Sequence[str]} - Labels to remove

        Returns:
            List[Dict] -- List of parsed label json

        Throws:
            ValueError if the response does not contain valid json (unlikely).
            HttpError if the server returns an error code.
        """
        label_names = set([label["name"] for label in pull["labels"]])
        if add:
            label_names = label_names.union(add)
        if remove:
            label_names = label_names.difference(remove)
        return self.replace_issue_labels(
            repository=pull["base"]["repo"]["full_name"],
            issue_number=pull["number"],
            labels=list(label_names),
        )

    def list_repos(self, org: str) -> List[Dict]:
        """Returns a list of all the repositories in an organization.

        See https://developer.github.com/v3/repos/#list-organization-repositories

        Args:
            org (str): The name of the organization.

        Returns:
            List[Dict]: The list of repository names.
        """
        url = f"{_GITHUB_ROOT}/orgs/{org}/repos?type=public"
        repos: List[Dict] = []
        while url:
            response = self.session.get(url)
            json = _get_json_or_raise_exception(response)
            repos.extend(json)
            url = response.links.get("next", {}).get("url")
        return repos

    def get_languages(self, repository) -> Dict[str, int]:
        """Returns the # of lines of code of each programming language in the repo.

        See: https://developer.github.com/v3/repos/#list-repository-languages

        Args:
            repository {str} -- GitHub repository with the format [owner]/[repo]

        Returns:
            Dict[str, int]: Map of programming language to lines of code.
        """
        url = f"{_GITHUB_ROOT}/repos/{repository}/languages"
        langs: Dict[str, int] = {}

        while url:
            response = self.session.get(url)
            json = _get_json_or_raise_exception(response)
            langs.update(json)

            url = response.links.get("next", {}).get("url")
        return langs

    def get_labels(self, repository: str) -> Sequence[str]:
        """Returns labels for a repository.

        See: https://developer.github.com/v3/issues/labels/#list-all-labels-for-this-repository

        Arguments:
            repository {str} -- GitHub repository with the format [owner]/[repo]

        Returns:
            List[str] -- List of label names

        Throws:
            ValueError if the response does not contain valid json (unlikely).
            HttpError if the server returns an error code.
        """
        url = f"{_GITHUB_ROOT}/repos/{repository}/labels"
        labels = []

        while url:
            response = self.session.get(url)
            json = _get_json_or_raise_exception(response)
            for item in json:
                labels.append(item["name"])

            url = response.links.get("next", {}).get("url")

        return labels

    def get_api_label(self, repository: str, synth_path: str) -> Optional[str]:
        """Try to match the synth path to an api: * label.

        Arguments:
            repository {str} -- GitHub repository with the format [owner]/[repo]
            synth_path {str} -- Path in the repo to the synth.py file

        Returns:
            Optional[str] -- Label name if a matching label is found.
        """
        if synth_path == "":
            return None

        api_labels = filter(lambda label: "api" in label, self.get_labels(repository))
        synth_path = synth_path.replace("_", "").lower()

        for label in api_labels:
            if synth_path in label:
                return label

        return None


def _get_json_or_raise_exception(response: requests.Response) -> Union[Dict, List]:
    """Helper to parse json response from GitHub.

    If the response error code indicates an error (400+), try to log the
    error message if pressent.

    Arguments:
        response {requests.Response} - The HTTP response object

    Returns:
        Union[Dict, List] - Parsed json data
    """
    try:
        json = response.json()
        if response.status_code >= 400:
            message = json.get("message")
            if message:
                logger.error(
                    f"Error making request ({response.status_code}): {message}"
                )
            else:
                logger.error(f"Error making request ({response.status_code})")
            logger.debug(json)
            response.raise_for_status()
        return json
    except ValueError as e:
        logger.error(f"Error parsing response json: {e}")
        raise
