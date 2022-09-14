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

function main(backendService, project, resourceGroupReferenceResource) {
  // [START compute_v1_generated_BackendServices_GetHealth_async]
  /**
   * This snippet has been automatically generated and should be regarded as a code template only.
   * It will require modifications to work.
   * It may require correct/in-range values for request initialization.
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Name of the BackendService resource to which the queried instance belongs.
   */
  // const backendService = 'abc123'
  /**
   */
  // const project = 'my-project'
  /**
   *  The body resource for this request
   */
  // const resourceGroupReferenceResource = {}

  // Imports the Compute library
  const {BackendServicesClient} = require('@google-cloud/compute').v1;

  // Instantiates a client
  const computeClient = new BackendServicesClient();

  async function callGetHealth() {
    // Construct request
    const request = {
      backendService,
      project,
      resourceGroupReferenceResource,
    };

    // Run request
    const response = await computeClient.getHealth(request);
    console.log(response);
  }

  callGetHealth();
  // [END compute_v1_generated_BackendServices_GetHealth_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
