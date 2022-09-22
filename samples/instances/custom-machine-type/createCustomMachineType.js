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
 * Sends an instance creation request to the Compute Engine API and waits for it to complete.
 *
 * @param {string} projectId - ID or number of the project you want to use.
 * @param {string} zone - Name of the zone you want to use, for example: us-west3-b
 * @param {string} instanceName - Name of the new machine.
 * @param {string} machineType - Machine type you want to create in following format:
 *    "zones/{zone}/machineTypes/{type_name}". For example:
 *    "zones/europe-west3-c/machineTypes/f1-micro"
 *    You can find the list of available machine types using:
 *    https://cloud.google.com/sdk/gcloud/reference/compute/machine-types/list
 */
function main(projectId, zone, instanceName, machineType) {
  // [START compute_custom_machine_type_create]
  /**
   * TODO(developer): Uncomment and replace these variables before running the sample.
   */
  // const projectId = 'YOUR_PROJECT_ID';
  // const zone = 'europe-central2-b';
  // const instanceName = 'YOUR_INSTANCE_NAME';
  // const machineType = 'zones/zone/machineTypes/type_name';

  const compute = require('@google-cloud/compute');

  async function createInstanceWithCustomMachineType() {
    const instancesClient = new compute.InstancesClient();

    const [response] = await instancesClient.insert({
      instanceResource: {
        name: instanceName,
        disks: [
          {
            initializeParams: {
              diskSizeGb: '64',
              sourceImage:
                'projects/debian-cloud/global/images/family/debian-11/',
            },
            autoDelete: true,
            boot: true,
          },
        ],
        machineType,
        networkInterfaces: [
          {
            name: 'global/networks/default',
          },
        ],
      },
      project: projectId,
      zone,
    });
    let operation = response.latestResponse;
    const operationsClient = new compute.ZoneOperationsClient();

    // Wait for the create operation to complete.
    while (operation.status !== 'DONE') {
      [operation] = await operationsClient.wait({
        operation: operation.name,
        project: projectId,
        zone: operation.zone.split('/').pop(),
      });
    }

    console.log('Instance created.');
  }

  createInstanceWithCustomMachineType();
  // [END compute_custom_machine_type_create]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});

main(...process.argv.slice(2));
