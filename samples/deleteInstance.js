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
 * Sends a delete request to GCP and waits for it to complete.
 *
 * @param {string} projectId - ID or number of the project you want to use.
 * @param {string} zone - Name of the zone you want to check, for example: us-west3-b
 * @param {string} machineName - Name of the machine you want to delete.
 */
function main(projectId, zone, machineName) {
  // [START compute_instances_delete]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  // const projectId = 'YOUR_PROJECT_ID';
  // const zone = 'europe-central2-b'
  // const machineName = 'YOUR_MACHINE_NAME';

  const compute = require('@google-cloud/compute');

  async function deleteInstance() {
    const client = new compute.InstancesClient({fallback: 'rest'});

    console.log(`Deleting ${machineName} from ${zone}...`);

    const operation = await client.delete({
      project: projectId,
      zone,
      instance: machineName,
    });

    if (operation[0].status === 'RUNNING') {
      const operationClient = new compute.ZoneOperationsClient({
        fallback: 'rest',
      });

      await operationClient.wait({
        operation: operation[0].name,
        project: projectId,
        zone: operation[0].zone.split('/').pop(),
      });
    }

    console.log('Instance deleted.');
  }

  deleteInstance();
  // [END compute_instances_delete]
}

main(...process.argv.slice(2));
