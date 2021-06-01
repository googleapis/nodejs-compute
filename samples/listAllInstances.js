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
 * Gets all instances present in a project, grouped by their zone.
 *
 * @param {string} projectId - ID or number of the project you want to use.
 */
function main(projectId) {
  // [START compute_instances_list_all]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  // const projectId = 'YOUR_PROJECT_ID';

  const compute = require('@google-cloud/compute');

  async function listAllInstances() {
    const client = new compute.InstancesClient({fallback: 'rest'});
    const aggListRequest = await client.aggregatedList({
      project: projectId,
    });
    const aggList = aggListRequest[0].items;

    console.log('Instances found:');

    for (const zone in aggList) {
      const instances = aggList[zone].instances;
      if (instances && instances.length > 0) {
        console.log(` ${zone}`);
        for (const instance of instances) {
          console.log(` - ${instance.name} (${instance.machineType})`);
        }
      }
    }
  }

  listAllInstances();
  // [END compute_instances_list_all]
}

main(...process.argv.slice(2));
