// Copyright 2022 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ** This file is automatically generated by gapic-generator-typescript. **
// ** https://github.com/googleapis/gapic-generator-typescript **
// ** All changes to this file may be overwritten. **



'use strict';

function main(disk, project, region, regionDisksAddResourcePoliciesRequestResource) {
  // [START compute_v1_generated_RegionDisks_AddResourcePolicies_async]
  /**
   * This snippet has been automatically generated and should be regarded as a code template only.
   * It will require modifications to work.
   * It may require correct/in-range values for request initialization.
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  The disk name for this request.
   */
  // const disk = 'abc123'
  /**
   *  Project ID for this request.
   */
  // const project = 'my-project'
  /**
   *  The name of the region for this request.
   */
  // const region = 'us-central1'
  /**
   *  The body resource for this request
   */
  // const regionDisksAddResourcePoliciesRequestResource = {}
  /**
   *  An optional request ID to identify requests. Specify a unique request ID so that if you must retry your request, the server will know to ignore the request if it has already been completed. For example, consider a situation where you make an initial request and the request times out. If you make the request again with the same request ID, the server can check if original operation with the same request ID was received, and if so, will ignore the second request. This prevents clients from accidentally creating duplicate commitments. The request ID must be a valid UUID with the exception that zero UUID is not supported ( 00000000-0000-0000-0000-000000000000).
   */
  // const requestId = 'abc123'

  // Imports the Compute library
  const {RegionDisksClient} = require('@google-cloud/compute').v1;

  // Instantiates a client
  const computeClient = new RegionDisksClient();

  async function callAddResourcePolicies() {
    // Construct request
    const request = {
      disk,
      project,
      region,
      regionDisksAddResourcePoliciesRequestResource,
    };

    // Run request
    const response = await computeClient.addResourcePolicies(request);
    console.log(response);
  }

  callAddResourcePolicies();
  // [END compute_v1_generated_RegionDisks_AddResourcePolicies_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
