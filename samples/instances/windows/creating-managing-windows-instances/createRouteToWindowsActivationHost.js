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
 * Creates a new route to kms.windows.googlecloud.com (35.190.247.13) for Windows activation.
 *
 * @param {string} projectId - ID or number of the project you want to use.
 * @param {string} routeName - Name of the route you want to create.
 * @param {string} networkName - Name of the network you want the new instance to use.
 *   For example: "global/networks/default" represents the network
 *   named "default", which is created automatically for each project.
 */
function main(projectId, routeName, networkName) {
  // [START compute_create_route_windows_activation]
  /**
   * TODO(developer): Uncomment and replace these variables before running the sample.
   */
  // const projectId = 'YOUR_PROJECT_ID';
  // const routeName = 'YOUR_ROUTE_NAME';
  // const networkName = 'global/networks/default';

  const compute = require('@google-cloud/compute');

  async function createRouteToWindowsActivationHost() {
    const routesClient = new compute.RoutesClient();

    // If you have Windows instances without external IP addresses,
    // you must also enable Private Google Access so that instances
    // with only internal IP addresses can send traffic to the external
    // IP address for kms.windows.googlecloud.com.
    // More infromation: https://cloud.google.com/vpc/docs/configure-private-google-access#enabling
    const [response] = await routesClient.insert({
      project: projectId,
      routeResource: {
        name: routeName,
        destRange: '35.190.247.13/32',
        network: networkName,
        nextHopGateway: `projects/${projectId}/global/gateways/default-internet-gateway`,
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

    console.log('Route created.');
  }

  createRouteToWindowsActivationHost();
  // [END compute_create_route_windows_activation]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});

main(...process.argv.slice(2));
