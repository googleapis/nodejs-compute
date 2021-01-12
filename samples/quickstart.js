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

async function main() {
  // [START compute_quickstart]
  const compute = require('@google-cloud/compute');

  function sleep(timeoutMs) {
    return new Promise(resolve => {
      setTimeout(resolve, timeoutMs);
    });
  }

  const client = new compute.AddressesClient({fallback: 'rest'});
  const project = await client.getProjectId();
  const region = 'us-east1';

  const addressResource = {
    name: 'test-address-123',
  };

  const [insertResponse] = await client.insert({
    project,
    region,
    addressResource,
  });
  console.log(insertResponse);

  await sleep(5000);

  const [listResponse1] = await client.list({
    project,
    region,
  });
  console.log(listResponse1);

  const [deleteResponse] = await client.delete({
    project,
    region,
    address: addressResource.name,
  });
  console.log(deleteResponse);

  await sleep(5000);

  const [listResponse2] = await client.list({
    project,
    region,
  });
  console.log(listResponse2);
  console.log('Quickstart sample completed');
  // [END compute_quickstart]
}

main().catch(console.error);
