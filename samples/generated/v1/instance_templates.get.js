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

function main(instanceTemplate, project) {
  // [START compute_v1_generated_InstanceTemplates_Get_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  The name of the instance template.
   */
  // const instanceTemplate = 'abc123'
  /**
   *  Project ID for this request.
   */
  // const project = 'my-project'

  // Imports the Compute library
  const {InstanceTemplatesClient} = require('@google-cloud/compute').v1;

  // Instantiates a client
  const computeClient = new InstanceTemplatesClient();

  async function callGet() {
    // Construct request
    const request = {
      instanceTemplate,
      project,
    };

    // Run request
    const response = await computeClient.get(request);
    console.log(response);
  }

  callGet();
  // [END compute_v1_generated_InstanceTemplates_Get_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
