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

const compute = require('@google-cloud/compute');

const {describe, it} = require('mocha');
const uuid = require('uuid');
const cp = require('child_process');
const {assert} = require('chai');

const client = new compute.InstancesClient({fallback: 'rest'});

const execSync = cmd => cp.execSync(cmd, {encoding: 'utf-8'});

describe('samples', () => {
  const machineName = `gcloud-test-intance-${uuid.v4().split('-')[0]}`;
  const zone = 'europe-central2-b';

  it('should create instance', async () => {
    const projectId = await client.getProjectId();
    const output = execSync(
      `node createInstance ${projectId} ${zone} ${machineName}`
    );
    assert.match(output, /Instance created./);
  });

  it('should print instances list', async () => {
    const projectId = await client.getProjectId();
    const output = execSync(`node listInstances ${projectId} ${zone}`);
    assert.match(output, /Instances found in zone/);
  });

  it('should print all instances list', async () => {
    const projectId = await client.getProjectId();
    const output = execSync(`node listAllInstances ${projectId}`);
    assert.match(output, /Instances found:/);
  });

  it('should delete instance', async () => {
    const projectId = await client.getProjectId();
    const output = execSync(
      `node deleteInstance ${projectId} ${zone} ${machineName}`
    );
    assert.match(output, /Instance deleted./);
  });

  it('should wait for operation', async () => {
    const projectId = await client.getProjectId();

    const newMachineName = `gcloud-test-intance-${uuid.v4().split('-')[0]}`;

    execSync(`node createInstance ${projectId} ${zone} ${newMachineName}`);

    const operation = await client.delete({
      project: projectId,
      zone,
      instance: newMachineName,
    });

    const operationString = JSON.stringify(operation);

    const output = execSync(
      `node waitForOperation ${projectId} '${operationString}'`
    );
    assert.match(output, /Operation finished./);
  });
});
