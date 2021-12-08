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


'use strict';

function main(backendService, project, signedUrlKeyResource) {
  // [START compute_v1_generated_BackendServices_AddSignedUrlKey_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Name of the BackendService resource to which the Signed URL Key should be added. The name should conform to RFC1035.
   */
  // const backendService = 'abc123'
  /**
   *  Project ID for this request.
   */
  // const project = 'my-project'
  /**
   *  An optional request ID to identify requests. Specify a unique request ID so that if you must retry your request, the server will know to ignore the request if it has already been completed. For example, consider a situation where you make an initial request and the request times out. If you make the request again with the same request ID, the server can check if original operation with the same request ID was received, and if so, will ignore the second request. This prevents clients from accidentally creating duplicate commitments. The request ID must be a valid UUID with the exception that zero UUID is not supported ( 00000000-0000-0000-0000-000000000000).
   */
  // const requestId = 'abc123'
  /**
   *  The body resource for this request
   */
  // const signedUrlKeyResource = {}

  // Imports the Compute library
  const {BackendServicesClient} = require('@google-cloud/compute').v1;

  // Instantiates a client
  const computeClient = new BackendServicesClient();

  async function callAddSignedUrlKey() {
    // Construct request
    const request = {
      backendService,
      project,
      signedUrlKeyResource,
    };

    // Run request
    const response = await computeClient.addSignedUrlKey(request);
    console.log(response);
  }

  callAddSignedUrlKey();
  // [END compute_v1_generated_BackendServices_AddSignedUrlKey_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
