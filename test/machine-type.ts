// Copyright 2016 Google LLC
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
import * as assert from 'assert';
import * as proxyquire from 'proxyquire';
import {ServiceObject} from '@google-cloud/common';
import type {ServiceObjectConfig} from '@google-cloud/common';

import type {MachineType as MachineTypeType, Zone} from '../src';

class FakeServiceObject extends ServiceObject {
  calledWith_: IArguments;
  constructor(config: ServiceObjectConfig) {
    super(config);
    // eslint-disable-next-line prefer-rest-params
    this.calledWith_ = arguments;
  }
}

describe('MachineType', () => {
  let MachineType: typeof MachineTypeType;
  let machineType: MachineTypeType;
  const ZONE_NAME = 'zone-1';
  const ZONE = {
    name: ZONE_NAME,
    compute: {},
  } as Zone;

  const MACHINE_TYPE_NAME = 'g1-small';

  before(() => {
    ({MachineType} = proxyquire('../src/machine-type.js', {
      '@google-cloud/common': {
        ServiceObject: FakeServiceObject,
      },
    }));
  });

  beforeEach(() => {
    machineType = new MachineType(ZONE, MACHINE_TYPE_NAME);
  });

  describe('instantiation', () => {
    it('should localize the zone', () => {
      assert.strictEqual(machineType.zone, ZONE);
    });

    it('should localize the name', () => {
      assert.strictEqual(machineType.name, MACHINE_TYPE_NAME);
    });

    it('should inherit from ServiceObject', () => {
      assert(machineType instanceof ServiceObject);

      const calledWith = ((machineType as unknown) as FakeServiceObject)
        .calledWith_[0];

      assert.strictEqual(calledWith.parent, ZONE);
      assert.strictEqual(calledWith.baseUrl, '/machineTypes');
      assert.strictEqual(calledWith.id, MACHINE_TYPE_NAME);
      assert.deepStrictEqual(calledWith.methods, {
        exists: true,
        get: true,
        getMetadata: true,
      });
    });
  });
});
