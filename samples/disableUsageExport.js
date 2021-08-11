// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Disable Compute Engine usage export bucket for the Cloud Project.
 *
 * @param {string} projectId - ID or number of the project you want to use.
 */
function main(projectId) {
  // [START compute_usage_report_disable]
  /**
   * TODO(developer): Uncomment and replace these variables before running the sample.
   */
  // const projectId = 'YOUR_PROJECT_ID';

  const compute = require('@google-cloud/compute');

  async function disableUsageExport() {
    const projectsClient = new compute.ProjectsClient({fallback: 'rest'});

    // Updating the setting with empty usageExportLocationResource will disable the usage report generation.
    projectsClient.setUsageExportBucket({
      project: projectId,
      usageExportLocationResource: {},
    });
  }

  disableUsageExport();
  // [END compute_usage_report_disable]
}

main(...process.argv.slice(2));
