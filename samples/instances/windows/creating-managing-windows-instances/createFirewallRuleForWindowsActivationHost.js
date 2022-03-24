// Copyright 2022 Google LLC
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
 * Creates an egress firewall rule with the highest priority for host kms.windows.googlecloud.com (35.190.247.13) for Windows activation.
 *
 * @param {string} projectId - ID or number of the project you want to use.
 * @param {string} firewallRuleName - Name of the firewall rule you want to create.
 * @param {string} networkName - Name of the network you want the new instance to use.
 *   For example: "global/networks/default" represents the network
 *   named "default", which is created automatically for each project.
 */
function main(projectId, firewallRuleName, networkName) {
  // [START compute_create_egress_rule_windows_activation]
  /**
   * TODO(developer): Uncomment and replace these variables before running the sample.
   */
  // const projectId = 'YOUR_PROJECT_ID';
  // const firewallRuleName = 'YOUR_FIREWALL_RULE_NAME';
  // const networkName = 'global/networks/default';

  const compute = require('@google-cloud/compute');

  async function createFirewallRuleForWindowsActivationHost() {
    const firewallsClient = new compute.FirewallsClient();

    const [response] = await firewallsClient.insert({
      project: projectId,
      firewallResource: {
        name: firewallRuleName,
        allowed: [
          {
            IPProtocol: 'tcp',
            ports: ['1688'],
          },
        ],
        direction: 'EGRESS',
        network: networkName,
        destinationRanges: ['35.190.247.13/32'],
        priority: 0,
      },
    });
    let operation = response.latestResponse;
    const operationsClient = new compute.GlobalOperationsClient();

    // Wait for the create operation to complete.
    while (operation.status !== 'DONE') {
      [operation] = await operationsClient.wait({
        operation: operation.name,
        project: projectId,
      });
    }

    console.log('Firewall rule created.');
  }

  createFirewallRuleForWindowsActivationHost();
  // [END compute_create_egress_rule_windows_activation]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});

main(...process.argv.slice(2));
