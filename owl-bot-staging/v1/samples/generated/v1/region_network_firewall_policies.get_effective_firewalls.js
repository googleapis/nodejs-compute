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

function main(network, project, region) {
  // [START compute_v1_generated_RegionNetworkFirewallPolicies_GetEffectiveFirewalls_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Network reference
   */
  // const network = 'abc123'
  /**
   *  Project ID for this request.
   */
  // const project = 'my-project'
  /**
   *  Name of the region scoping this request.
   */
  // const region = 'us-central1'

  // Imports the Compute library
  const {RegionNetworkFirewallPoliciesClient} = require('@google-cloud/compute').v1;

  // Instantiates a client
  const computeClient = new RegionNetworkFirewallPoliciesClient();

  async function callGetEffectiveFirewalls() {
    // Construct request
    const request = {
      network,
      project,
      region,
    };

    // Run request
    const response = await computeClient.getEffectiveFirewalls(request);
    console.log(response);
  }

  callGetEffectiveFirewalls();
  // [END compute_v1_generated_RegionNetworkFirewallPolicies_GetEffectiveFirewalls_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
