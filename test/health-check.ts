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
import {ServiceObject, util} from '@google-cloud/common';
import type {
  DecorateRequestOptions,
  Metadata,
  MetadataCallback,
  ServiceObjectConfig,
} from '@google-cloud/common';
import * as promisify from '@google-cloud/promisify';

import type {
  Compute,
  CreateHealthCheckOptions,
  CreateResourceCallback,
  HealthCheck as HealthCheckType,
  Operation,
} from '../src';

let promisified = false;
const fakePromisify = Object.assign({}, promisify, {
  promisifyAll: function (Class: typeof ServiceObject) {
    if (Class.name === 'HealthCheck') {
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

describe('HealthCheck', () => {
  let HealthCheck: typeof HealthCheckType;
  let healthCheck: HealthCheckType;

  const COMPUTE = ({
    createHealthCheck: util.noop,
  } as unknown) as Compute;
  const HEALTH_CHECK_NAME = 'health-check-name';
  const OPTIONS = {};

  before(() => {
    ({HealthCheck} = proxyquire('../src/health-check.js', {
      '@google-cloud/common': {
        ServiceObject: FakeServiceObject,
      },
      '@google-cloud/promisify': fakePromisify,
    }));
  });

  beforeEach(() => {
    healthCheck = new HealthCheck(COMPUTE, HEALTH_CHECK_NAME, OPTIONS);
  });

  afterEach(() => {
    COMPUTE.createHealthCheck = util.noop as any;
  });

  describe('instantiation', () => {
    it('should inherit from ServiceObject', () => {
      assert(healthCheck instanceof FakeServiceObject);

      const calledWith = ((healthCheck as unknown) as FakeServiceObject)
        .calledWith_[0];

      assert.strictEqual(calledWith.parent, COMPUTE);
      assert.strictEqual(calledWith.id, HEALTH_CHECK_NAME);
      assert.deepStrictEqual(calledWith.methods, {
        create: true,
        exists: true,
        get: true,
        getMetadata: true,
      });
    });

    it('should promisify all the things', () => {
      assert(promisified);
    });

    describe('http', () => {
      it('should set the correct baseUrl', () => {
        const calledWith = ((healthCheck as unknown) as FakeServiceObject)
          .calledWith_[0];
        assert.strictEqual(calledWith.baseUrl, '/global/httpHealthChecks');
      });

      it('should not set options.https when created', done => {
        const createMethod = ((healthCheck as unknown) as FakeServiceObject)
          .calledWith_[0].createMethod;
        const NAME = 'name';
        const OPTIONS = {a: 'b'};
        const originalOptions = Object.assign({}, OPTIONS);
        COMPUTE.createHealthCheck = function (
          name: string,
          opts?:
            | CreateHealthCheckOptions
            | CreateResourceCallback<HealthCheckType>,
          callback?: CreateResourceCallback<HealthCheckType>
        ): any {
          assert.strictEqual(name, NAME);
          assert.deepStrictEqual(opts, OPTIONS);
          assert.deepStrictEqual(OPTIONS, originalOptions);
          callback!(null); // done()
        };
        createMethod(NAME, OPTIONS, done);
      });

      it('should not require a callback when creating', done => {
        const createMethod = ((healthCheck as unknown) as FakeServiceObject)
          .calledWith_[0].createMethod;

        COMPUTE.createHealthCheck = function (
          name: string,
          opts?:
            | CreateHealthCheckOptions
            | CreateResourceCallback<HealthCheckType>,
          callback?: CreateResourceCallback<HealthCheckType>
        ): any {
          assert.deepStrictEqual(opts, {});
          callback!(null); // done()
        };

        createMethod('name', done);
      });
    });

    describe('https', () => {
      let healthCheck: HealthCheckType;

      beforeEach(() => {
        healthCheck = new HealthCheck(COMPUTE, HEALTH_CHECK_NAME, {
          https: true,
        });
      });

      it('should set the correct baseUrl', () => {
        const calledWith = ((healthCheck as unknown) as FakeServiceObject)
          .calledWith_[0];

        assert.strictEqual(calledWith.baseUrl, '/global/httpsHealthChecks');
      });

      it('should set options.https = true when created', done => {
        const createMethod = ((healthCheck as unknown) as FakeServiceObject)
          .calledWith_[0].createMethod;

        const NAME = 'name';
        const OPTIONS = {a: 'b'};
        const originalOptions = Object.assign({}, OPTIONS);

        COMPUTE.createHealthCheck = function (
          name: string,
          opts?:
            | CreateHealthCheckOptions
            | CreateResourceCallback<HealthCheckType>,
          callback?: CreateResourceCallback<HealthCheckType>
        ): any {
          assert.strictEqual(name, NAME);
          assert.deepStrictEqual(opts, Object.assign({https: true}, OPTIONS));
          assert.deepStrictEqual(OPTIONS, originalOptions);
          callback!(null); // done()
        };

        createMethod(NAME, OPTIONS, done);
      });

      it('should not require a callback when creating', done => {
        const createMethod = ((healthCheck as unknown) as FakeServiceObject)
          .calledWith_[0].createMethod;

        COMPUTE.createHealthCheck = function (
          name: string,
          opts?:
            | CreateHealthCheckOptions
            | CreateResourceCallback<HealthCheckType>,
          callback?: CreateResourceCallback<HealthCheckType>
        ): any {
          assert.deepStrictEqual(opts, {https: true});
          callback!(null); // done()
        };

        createMethod('name', done);
      });
    });
  });

  describe('delete', () => {
    it('should call ServiceObject.delete', done => {
      FakeServiceObject.prototype.request = function (): any {
        assert.strictEqual(this, healthCheck);
        done();
      };

      healthCheck.delete();
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
        healthCheck.delete((err, operation, apiResponse_) => {
          assert.strictEqual(err, error);
          assert.strictEqual(operation, null);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });

      it('should not require a callback', () => {
        assert.doesNotThrow(() => {
          healthCheck.delete();
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
        const operation = ({}) as Operation;

        healthCheck.compute.operation = function (name) {
          assert.strictEqual(name, apiResponse.name);
          return operation;
        };

        healthCheck.delete((err, operation_, apiResponse_) => {
          assert.ifError(err);
          assert.strictEqual(operation_, operation);
          assert.strictEqual(operation_!.metadata, apiResponse);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });

      it('should not require a callback', () => {
        assert.doesNotThrow(() => {
          healthCheck.delete();
        });
      });
    });
  });

  describe('setMetadata', () => {
    const METADATA = {};

    it('should call ServiceObject.setMetadata', done => {
      FakeServiceObject.prototype.setMetadata = function (
        metadata: Metadata
      ): any {
        assert.strictEqual(this, healthCheck);
        assert.strictEqual(metadata, METADATA);
        done();
      };

      healthCheck.setMetadata(METADATA, assert.ifError);
    });

    describe('error', () => {
      const error = new Error('Error.');
      const apiResponse = {};

      beforeEach(() => {
        FakeServiceObject.prototype.setMetadata = function (
          metadata: Metadata,
          callback: MetadataCallback
        ): any {
          callback(error, apiResponse);
        };
      });

      it('should return an error if the request fails', done => {
        healthCheck.setMetadata(METADATA, (err, op, apiResponse_) => {
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
        FakeServiceObject.prototype.setMetadata = function (
          metadata: Metadata,
          callback: MetadataCallback
        ): any {
          callback(null, apiResponse);
        };
      });

      it('should execute callback with operation & response', done => {
        const operation = ({}) as Operation;
        const metadata = {a: 'b'};

        healthCheck.compute.operation = function (name) {
          assert.strictEqual(name, apiResponse.name);
          return operation;
        };

        healthCheck.setMetadata(metadata, (err, op, apiResponse_) => {
          assert.ifError(err);
          assert.strictEqual(op, operation);
          assert.strictEqual(op!.metadata, apiResponse);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });

      it('should not require a callback', () => {
        assert.doesNotThrow(() => {
          healthCheck.setMetadata({a: 'b'});
        });
      });
    });
  });
});
