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

function main(firewallPolicy) {
  // [START compute_v1_generated_FirewallPolicies_GetAssociation_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Name of the firewall policy to which the queried rule belongs.
   */
  // const firewallPolicy = 'abc123'
  /**
   *  The name of the association to get from the firewall policy.
   */
  // const name = 'abc123'

  // Imports the Compute library
  const {FirewallPoliciesClient} = require('@google-cloud/compute').v1;

  // Instantiates a client
  const computeClient = new FirewallPoliciesClient();

  async function callGetAssociation() {
    // Construct request
    const request = {
      firewallPolicy,
    };

    // Run request
    const response = await computeClient.getAssociation(request);
    console.log(response);
  }

  callGetAssociation();
  // [END compute_v1_generated_FirewallPolicies_GetAssociation_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
