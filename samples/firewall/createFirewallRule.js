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
 * Creates a simple firewall rule allowing for incoming HTTP and HTTPS access from the entire Internet.
 *
 * @param {string} projectId - project ID or project number of the Cloud project you want to use.
 * @param {string} firewallRuleName - name of the rule that is created.
 */
 function main(projectId, firewallRuleName) {
  // [START compute_firewall_create]
  /**
   * TODO(developer): Uncomment and replace these variables before running the sample.
   */
  // const projectId = 'YOUR_PROJECT_ID';
  // const firewallRuleName = 'YOUR_FIREWALL_RULE_NAME'

  const compute = require('@google-cloud/compute');
  const compute_protos = compute.protos.google.cloud.compute.v1;

  async function createFirewallRule() {
    const firewallsClient = new compute.FirewallsClient();
    const operationsClient = new compute.GlobalOperationsClient();
    
    const tcpAllowed = new compute_protos.Allowed()
    tcpAllowed.IPProtocol = "tcp";
    tcpAllowed.ports = ["80", "443"]

    const firewallRule = new compute_protos.Firewall();
    firewallRule.name = firewallRuleName;
    firewallRule.direction = compute_protos.Firewall.Direction.INGRESS;
    firewallRule.allowed = [tcpAllowed]
    firewallRule.sourceRanges = ["0.0.0.0/0"]
    firewallRule.network = "global/networks/default"
    firewallRule.description = "Allowing TCP traffic on port 80 and 443 from Internet."

    // Note that the default value of priority for the firewall API is 1000.
    // If you check the value of `firewallRule.priority` at this point it
    // will be equal to 0, however it is not treated as "set" by the library and thus
    // the default will be applied to the new rule. If you want to create a rule that
    // has priority == 0, you need to explicitly set it so:

    // firewallRule.priority = 0

    console.log(firewallRule.priority);

    let [operation] = await firewallsClient.insert({
      project: projectId, 
      firewallResource: firewallRule
    });

    // Wait for the create operation to complete.
    while (operation.status !== 'DONE') {
      [operation] = await operationsClient.wait({
        operation: operation.name,
        project: projectId,
      });
    }
  }

  createFirewallRule();
  // [END compute_firewall_create]
}
    
main(...process.argv.slice(2));
    