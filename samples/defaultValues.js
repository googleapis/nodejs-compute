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
 * A sample script showing how to handle default values when communicating with the Compute Engine API.
 *
 * @param {string} projectId - project ID or project number of the project to update.
 * @param {string} bucketName - Google Cloud Storage Bucket used to store Compute Engine usage reports. An existing Google Cloud Storage bucket is required.
 * @param {string} reportNamePrefix - Report Name Prefix which defaults to an empty string to showcase default values behaviour.
 */
function main(projectId, bucketName, reportNamePrefix = '') {
  // [START compute_instances_verify_default_value]
  /**
   * TODO(developer): Uncomment and replace these variables before running the sample.
   */
  // const projectId = 'YOUR_PROJECT_ID';
  // const bucketName = 'YOUR_BUCKET_NAME';

  // [END compute_instances_verify_default_value]
  /**
   * Set Compute Engine usage export bucket for the Cloud Project. This sample presents how to interpret the default value for the report name prefix parameter.
   *
   * @param {string} projectId - project ID or project number of the project to update.
   * @param {string} bucketName - Google Cloud Storage Bucket used to store Compute Engine usage reports. An existing Google Cloud Storage bucket is required.
   * @param {string} reportNamePrefix - Report Name Prefix which defaults to an empty string to showcase default values behaviour.
   */
  // [START compute_instances_verify_default_value]
  async function setUsageExportBucket(
    projectId,
    bucketName,
    reportNamePrefix = ''
  ) {
  // [END compute_instances_verify_default_value]
    // [START compute_usage_report_set]
    /**
     * TODO(developer): Uncomment and replace these variables before running the sample.
     */
    // const projectId = 'YOUR_PROJECT_ID';
    // const bucketName = 'YOUR_BUCKET_NAME';

  // [START compute_instances_verify_default_value]
    const compute = require('@google-cloud/compute');
    const compute_protos = compute.protos.google.cloud.compute.v1;

    const usageExportLocationResource =
      new compute_protos.UsageExportLocation();
    usageExportLocationResource.bucketName = bucketName;
    usageExportLocationResource.reportNamePrefix = reportNamePrefix;

    if (!reportNamePrefix) {
      // Sending an empty value for reportNamePrefix, results in the next usage report being generated with the default prefix value "usage_gce". (see: https://cloud.google.com/compute/docs/reference/rest/v1/projects/get)
      console.log(
        'Setting reportNamePrefix to empty value causes the report to have the default prefix value `usage_gce`.'
      );
    }

    const projectsClient = new compute.ProjectsClient({fallback: 'rest'});
    projectsClient.setUsageExportBucket({
      project: projectId,
      usageExportLocationResource,
    });

    // [END compute_usage_report_set]
  }
  // [END compute_instances_verify_default_value]
  /**
   * Retrieve Compute Engine usage export bucket for the Cloud Project. Replaces the empty value returned by the API with the default value used to generate report file names.
   *
   * @param {string} projectId - project ID or project number of the project to update.
   * @returns {usageExportLocation} - object describing the current usage export settings for project projectId.
   */
  // [START compute_instances_verify_default_value]
  async function getUsageExportBucket(projectId) {
  // [END compute_instances_verify_default_value]
    // [START compute_usage_report_get]
    /**
     * TODO(developer): Uncomment and replace these variables before running the sample.
     */
    // const projectId = 'YOUR_PROJECT_ID';
  // [START compute_instances_verify_default_value]
    const compute = require('@google-cloud/compute');

    const projectsClient = new compute.ProjectsClient({fallback: 'rest'});
    const project = await projectsClient.get({
      project: projectId,
    });

    const usageExportLocation = project[0].usageExportLocation;

    if (!usageExportLocation.bucketName) {
      // The usage reports are disabled.
      return usageExportLocation;
    }

    if (!usageExportLocation.reportNamePrefix) {
      // Although the server sent the empty value, the next usage report generated with these settings still has the default prefix value `usage_gce`. (see: https://cloud.google.com/compute/docs/reference/rest/v1/projects/get)
      console.log(
        'Report name prefix not set, replacing with default value of `usage_gce`.'
      );
      usageExportLocation.reportNamePrefix = 'usage_gce';
    }

    return usageExportLocation;
    // [END compute_usage_report_get]
  }

  // [END compute_instances_verify_default_value]

  /**
   * Disable Compute Engine usage export bucket for the Cloud Project.
   *
   * @param {string} projectId - project ID or project number of the project to update.
   */
  async function disableUsageExport(projectId) {
    // [START compute_usage_report_disable]
    /**
     * TODO(developer): Uncomment and replace these variables before running the sample.
     */
    // const projectId = 'YOUR_PROJECT_ID';
    const compute = require('@google-cloud/compute');
    const compute_protos = compute.protos.google.cloud.compute.v1;

    const projectsClient = new compute.ProjectsClient({fallback: 'rest'});

    const usageExportLocationResource =
      new compute_protos.UsageExportLocation();
    usageExportLocationResource.bucketName = '';
    usageExportLocationResource.reportNamePrefix = '';

    // Updating the setting with empty bucket name will disable the usage report generation.
    projectsClient.setUsageExportBucket({
      project: projectId,
      usageExportLocationResource,
    });
    // [END compute_usage_report_disable]
  }

  setUsageExportBucket(projectId, bucketName, reportNamePrefix)
    .then(() => new Promise(resolve => setTimeout(resolve, 5000)))
    .then(() => getUsageExportBucket(projectId))
    .then(() => disableUsageExport(projectId));
}

main(...process.argv.slice(2));
