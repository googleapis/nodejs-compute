// Copyright 2015 Google LLC
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
import type {
  BodyResponseCallback,
  DecorateRequestOptions,
  ServiceObjectConfig,
} from '@google-cloud/common';
import * as promisify from '@google-cloud/promisify';

import type {Address as AddressType, Region, Operation} from '../src';

let promisified = false;
const fakePromisify = Object.assign({}, promisify, {
  promisifyAll: function (Class: typeof ServiceObject) {
    if (Class.name === 'Address') {
      promisified = true;
    }
  },
});

class FakeServiceObject extends ServiceObject {
  calledWith_: IArguments;
  constructor(config: ServiceObjectConfig) {
    super(config);
    // eslint-disable-next-line prefer-rest-params
    this.calledWith_ = arguments;
  }
}

describe('Address', () => {
  let Address: typeof AddressType;
  let address: AddressType;

  const ADDRESS_NAME = 'us-central1';
  const REGION = ({
    createAddress: () => {},
    compute: {},
  } as unknown) as Region;

  before(() => {
    ({Address} = proxyquire('../src/address.js', {
      '@google-cloud/common': {
        ServiceObject: FakeServiceObject,
      },
      '@google-cloud/promisify': fakePromisify,
    }));
  });

  beforeEach(() => {
    address = new Address(REGION, ADDRESS_NAME);
  });

  describe('instantiation', () => {
    it('should localize the region', () => {
      assert.strictEqual(address.region, REGION);
    });

    it('should localize the name', () => {
      assert.strictEqual(address.name, ADDRESS_NAME);
    });

    it('should promisify all the things', () => {
      assert(promisified);
    });

    it('should inherit from ServiceObject', done => {
      const regionInstance = Object.assign({}, REGION, {
        createAddress: {
          bind: function (context: any) {
            assert.strictEqual(context, regionInstance);
            done();
          },
        },
      });

      const address = new Address(regionInstance, ADDRESS_NAME);
      assert(address instanceof ServiceObject);

      const calledWith = ((address as unknown) as FakeServiceObject)
        .calledWith_[0];

      assert.strictEqual(calledWith.parent, regionInstance);
      assert.strictEqual(calledWith.baseUrl, '/addresses');
      assert.strictEqual(calledWith.id, ADDRESS_NAME);
      assert.deepStrictEqual(calledWith.methods, {
        create: true,
        exists: true,
        get: true,
        getMetadata: true,
      });
    });
  });

  describe('delete', () => {
    it('should make the correct API request', done => {
      address.request = function (reqOpts: DecorateRequestOptions): any {
        assert.strictEqual(reqOpts.method, 'DELETE');
        assert.strictEqual(reqOpts.uri, '');
        done();
      };

      address.delete(assert.ifError);
    });

    describe('error', () => {
      const error = new Error('Error.');
      const apiResponse = {a: 'b', c: 'd'};

      beforeEach(() => {
        address.request = function (
          reqOpts: DecorateRequestOptions,
          callback?: BodyResponseCallback
        ): any {
          callback!(error, apiResponse);
        };
      });

      it('should return an error if the request fails', done => {
        address.delete((err, operation, apiResponse_) => {
          assert.strictEqual(err, error);
          assert.strictEqual(operation, null);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });

      it('should not require a callback', () => {
        assert.doesNotThrow(() => {
          address.delete();
        });
      });
    });

    describe('success', () => {
      const apiResponse = {
        name: 'op-name',
      };

      beforeEach(() => {
        address.request = function (
          reqOpts: DecorateRequestOptions,
          callback?: BodyResponseCallback
        ): any {
          callback!(null, apiResponse);
        };
      });

      it('should execute callback with Operation & Response', done => {
        const operation = ({}) as Operation;

        address.region.operation = function (name) {
          assert.strictEqual(name, apiResponse.name);
          return operation;
        };

        address.delete((err, operation_, apiResponse_) => {
          assert.ifError(err);
          assert.strictEqual(operation_, operation);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });

      it('should not require a callback', () => {
        assert.doesNotThrow(() => {
          address.delete();
        });
      });
    });
  });
});
