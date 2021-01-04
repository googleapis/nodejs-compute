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
import {ServiceObject, util} from '@google-cloud/common';
import type {
  BodyResponseCallback,
  DecorateRequestOptions,
  MetadataCallback,
  ServiceObjectConfig,
} from '@google-cloud/common';
import * as promisify from '@google-cloud/promisify';

import type {Autoscaler as AutoscalerType, Operation, Zone} from '../src';

let promisified = false;
const fakePromisify = Object.assign({}, promisify, {
  promisifyAll: function (Class: typeof ServiceObject) {
    if (Class.name === 'Autoscaler') {
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

describe('Autoscaler', () => {
  let Autoscaler: typeof AutoscalerType;
  let autoscaler: AutoscalerType;

  const AUTOSCALER_NAME = 'autoscaler-name';

  const COMPUTE = {projectId: 'project-id'};
  const ZONE = ({
    compute: COMPUTE,
    name: 'us-central1-a',
    createAutoscaler: util.noop,
  } as unknown) as Zone;

  before(() => {
    ({Autoscaler} = proxyquire('../src/autoscaler.js', {
      '@google-cloud/common': {
        ServiceObject: FakeServiceObject,
      },
      '@google-cloud/promisify': fakePromisify,
    }));
  });

  beforeEach(() => {
    autoscaler = new Autoscaler(ZONE, AUTOSCALER_NAME);
  });

  describe('instantiation', () => {
    it('should localize the zone', () => {
      assert.strictEqual(autoscaler.zone, ZONE);
    });

    it('should localize the name', () => {
      assert.strictEqual(autoscaler.name, AUTOSCALER_NAME);
    });

    it('should promisify all the things', () => {
      assert(promisified);
    });

    it('should inherit from ServiceObject', () => {
      const createMethod = util.noop;

      const zoneInstance = Object.assign({}, ZONE, {
        createAutoscaler: {
          bind: function (context: any) {
            assert.strictEqual(context, zoneInstance);
            return createMethod;
          },
        },
      });

      const autoscaler = new Autoscaler(zoneInstance, AUTOSCALER_NAME);
      assert(autoscaler instanceof ServiceObject);

      const calledWith = ((autoscaler as unknown) as FakeServiceObject)
        .calledWith_[0];

      assert.strictEqual(calledWith.parent, zoneInstance);
      assert.strictEqual(calledWith.baseUrl, '/autoscalers');
      assert.strictEqual(calledWith.id, AUTOSCALER_NAME);
      assert.strictEqual(calledWith.createMethod, createMethod);
      assert.deepStrictEqual(calledWith.methods, {
        create: true,
        exists: true,
        get: true,
        getMetadata: true,
      });
    });
  });

  describe('delete', () => {
    it('should call ServiceObject.delete', done => {
      FakeServiceObject.prototype.request = function (): any {
        assert.strictEqual(this, autoscaler);
        done();
      };

      autoscaler.delete();
    });

    describe('error', () => {
      const error = new Error('Error.');
      const apiResponse = {a: 'b', c: 'd'};

      beforeEach(() => {
        FakeServiceObject.prototype.request = function (
          options: DecorateRequestOptions,
          callback?: MetadataCallback
        ): any {
          callback!(error, apiResponse);
        };
      });

      it('should return an error if the request fails', done => {
        autoscaler.delete((err, operation, apiResponse_) => {
          assert.strictEqual(err, error);
          assert.strictEqual(operation, null);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });

      it('should not require a callback', () => {
        assert.doesNotThrow(() => {
          autoscaler.delete();
        });
      });
    });

    describe('success', () => {
      const apiResponse = {
        name: 'op-name',
      };

      beforeEach(() => {
        FakeServiceObject.prototype.request = function (
          options: DecorateRequestOptions,
          callback?: MetadataCallback
        ): any {
          callback!(null, apiResponse);
        };
      });

      it('should execute callback with Operation & Response', done => {
        const operation = ({} as unknown) as Operation;

        autoscaler.zone.operation = function (name) {
          assert.strictEqual(name, apiResponse.name);
          return operation;
        };

        autoscaler.delete((err, operation_, apiResponse_) => {
          assert.ifError(err);
          assert.strictEqual(operation_, operation);
          assert.strictEqual(operation_!.metadata, apiResponse);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });

      it('should not require a callback', () => {
        assert.doesNotThrow(() => {
          autoscaler.delete();
        });
      });
    });
  });

  describe('setMetadata', () => {
    it('should make the correct API request', done => {
      const metadata = {};

      autoscaler.zone.request = function (
        reqOpts: DecorateRequestOptions
      ): any {
        assert.strictEqual(reqOpts.method, 'PATCH');
        assert.strictEqual(reqOpts.uri, '/autoscalers');
        assert.strictEqual(reqOpts.json, metadata);
        assert.deepStrictEqual(metadata, {
          name: autoscaler.name,
          zone: ZONE.name,
        });

        done();
      };

      autoscaler.setMetadata(metadata, assert.ifError);
    });

    describe('error', () => {
      const error = new Error('Error.');
      const apiResponse = {a: 'b', c: 'd'};

      beforeEach(() => {
        autoscaler.zone.request = function (
          reqOpts: DecorateRequestOptions,
          callback?: BodyResponseCallback
        ): any {
          callback!(error, apiResponse);
        };
      });

      it('should return an error if the request fails', done => {
        autoscaler.setMetadata({e: 'f'}, (err, op, apiResponse_) => {
          assert.strictEqual(err, error);
          assert.strictEqual(op, null);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });
    });

    describe('success', () => {
      const apiResponse = {
        name: 'op-name',
      };

      beforeEach(() => {
        autoscaler.zone.request = function (
          reqOpts: DecorateRequestOptions,
          callback?: BodyResponseCallback
        ): any {
          callback!(null, apiResponse);
        };
      });

      it('should execute callback with operation & response', done => {
        const operation = ({} as unknown) as Operation;
        const metadata = {a: 'b'};

        autoscaler.zone.operation = function (name) {
          assert.strictEqual(name, apiResponse.name);
          return operation;
        };

        autoscaler.setMetadata(metadata, (err, op, apiResponse_) => {
          assert.ifError(err);
          assert.strictEqual(op, operation);
          assert.strictEqual(op!.metadata, apiResponse);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });

      it('should not require a callback', () => {
        assert.doesNotThrow(() => {
          autoscaler.setMetadata({a: 'b'});
        });
      });
    });
  });
});
