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
 * Check whether an optional param was set to the default value when not provided an explicit value.
 *
 * @param {string} projectId - ID or number of the project you want to use.
 * @param {string} bucketName - Name of an existing Google Cloud Storage bucket.
 */
 function main(projectId, bucketName) {
    // [START compute_instances_verify_default_value]
    /**
     * TODO(developer): Uncomment and replace these variables before running the sample.
     */
    // const projectId = 'YOUR_PROJECT_ID';
    // const bucketName = 'YOUR_BUCKET_NAME';
  
    const compute = require('@google-cloud/compute');
    const assert = require('assert');
  
    async function verifyDefaultValue() {
      const client = new compute.ProjectsClient({fallback: 'rest'});
    
      // Here we explicitly DO NOT set reportNamePrefix.
      const operation = await client.setUsageExportBucket({
          project: projectId,
          usageExportLocationResource: {
              bucketName,
          },
      })
  
      if (operation[0].status === 'RUNNING') {
        const operationClient = new compute.GlobalOperationsClient({
          fallback: 'rest',
        });
  
        await operationClient.wait({
          operation: operation[0].name,
          project: projectId,
        });
      }
      
      const project = await client.get({
          project: projectId,
      });
    
      console.log(`Report name prefix: ${project[0].usageExportLocation.reportNamePrefix}.`)
    }
  
    verifyDefaultValue();
    // [END compute_instances_verify_default_value]
  }
  
  main(...process.argv.slice(2));
  