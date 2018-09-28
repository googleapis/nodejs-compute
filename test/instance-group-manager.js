/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const arrify = require('arrify');
const assert = require('assert');
const extend = require('extend');
const nodeutil = require('util');
const proxyquire = require('proxyquire');

const ServiceObject = require('@google-cloud/common').ServiceObject;
const util = require('@google-cloud/common').util;

let promisified = false;
const fakeUtil = extend({}, util, {
  promisifyAll: function(Class) {
    if (Class.name === 'InstanceGroupManager') {
      promisified = true;
    }
  },
});

function FakeServiceObject() {
  this.calledWith_ = arguments;
  ServiceObject.apply(this, arguments);
}

nodeutil.inherits(FakeServiceObject, ServiceObject);

let extended = false;
const fakePaginator = {
  extend: function(Class, methods) {
    if (Class.name !== 'InstanceGroupManager') {
      return;
    }

    extended = true;
    methods = arrify(methods);
    assert.strictEqual(Class.name, 'InstanceGroupManager');
    assert.deepStrictEqual(methods, ['getVMs']);
  },
  streamify: function(methodName) {
    return methodName;
  },
};

describe('InstanceGroupManager', function() {
  let InstanceGroupManager;
  let instanceGroupManager;

  const staticMethods = {};

  const ZONE = {
    name: 'my-zone',
    createInstanceGroupManager: util.noop,
    vm: util.noop,
  };
  const NAME = 'instance-group-manager-name';

  before(function() {
    InstanceGroupManager = proxyquire('../src/instance-group-manager.js', {
      '@google-cloud/common': {
        ServiceObject: FakeServiceObject,
        paginator: fakePaginator,
        util: fakeUtil,
      },
    });
    staticMethods.formatPorts_ = InstanceGroupManager.formatPorts_;
  });

  beforeEach(function() {
    extend(InstanceGroupManager, staticMethods);
    instanceGroupManager = new InstanceGroupManager(ZONE, NAME);
  });

  describe('instantiation', function() {
    it('should extend the correct methods', function() {
      assert(extended); // See `fakePaginator.extend`
    });

    it('should streamify the correct methods', function() {
      assert.strictEqual(instanceGroupManager.getVMsStream, 'getVMs');
    });

    it('should promisify all the things', function() {
      assert(promisified);
    });

    it('should localize the zone instance', function() {
      assert.strictEqual(instanceGroupManager.zone, ZONE);
    });

    it('should localize the name', function() {
      assert.strictEqual(instanceGroupManager.name, NAME);
    });

    it('should inherit from ServiceObject', function(done) {
      let instanceGroupManager;

      const zoneInstance = extend({}, ZONE, {
        createInstanceGroupManager: {
          bind: function(context) {
            assert.strictEqual(context, zoneInstance);

            setImmediate(function() {
              assert(instanceGroupManager instanceof ServiceObject);

              const calledWith = instanceGroupManager.calledWith_[0];

              assert.strictEqual(calledWith.parent, zoneInstance);
              assert.strictEqual(calledWith.baseUrl, '/instanceGroupManagers');
              assert.strictEqual(calledWith.id, NAME);
              assert.deepStrictEqual(calledWith.methods, {
                create: true,
                exists: true,
                get: true,
                getMetadata: true,
              });

              done();
            });
          },
        },
      });

      instanceGroupManager = new InstanceGroupManager(zoneInstance, NAME);
    });
  });

  describe('delete', function() {
    it('should call ServiceObject.delete', function(done) {
      FakeServiceObject.prototype.delete = function() {
        assert.strictEqual(this, instanceGroupManager);
        done();
      };

      instanceGroupManager.delete();
    });

    describe('error', function() {
      const error = new Error('Error.');
      const apiResponse = {a: 'b', c: 'd'};

      beforeEach(function() {
        FakeServiceObject.prototype.delete = function(callback) {
          callback(error, apiResponse);
        };
      });

      it('should return an error if the request fails', function(done) {
        instanceGroupManager.delete(function(err, operation, apiResponse_) {
          assert.strictEqual(err, error);
          assert.strictEqual(operation, null);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });

      it('should not require a callback', function() {
        assert.doesNotThrow(function() {
          instanceGroupManager.delete();
        });
      });
    });

    describe('success', function() {
      const apiResponse = {
        name: 'op-name',
      };

      beforeEach(function() {
        FakeServiceObject.prototype.delete = function(callback) {
          callback(null, apiResponse);
        };
      });

      it('should execute callback with Operation & Response', function(done) {
        const operation = {};

        instanceGroupManager.zone.operation = function(name) {
          assert.strictEqual(name, apiResponse.name);
          return operation;
        };

        instanceGroupManager.delete(function(err, operation_, apiResponse_) {
          assert.ifError(err);
          assert.strictEqual(operation_, operation);
          assert.strictEqual(operation_.metadata, apiResponse);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });

      it('should not require a callback', function() {
        assert.doesNotThrow(function() {
          instanceGroupManager.delete();
        });
      });
    });
  });

  describe('getVMs', function() {
    beforeEach(function() {
      instanceGroupManager.zone.vm = function() {
        return {};
      };
    });

    it('should accept only a callback', function(done) {
      instanceGroupManager.request = function(reqOpts) {
        assert.deepStrictEqual(reqOpts.qs, {});
        done();
      };

      instanceGroupManager.getVMs(assert.ifError);
    });

    it('should make the correct API request', function(done) {
      const query = {a: 'b', c: 'd'};

      instanceGroupManager.request = function(reqOpts) {
        assert.strictEqual(reqOpts.method, 'POST');
        assert.strictEqual(reqOpts.uri, '/listManagedInstances');
        assert.strictEqual(reqOpts.qs, query);
        assert.strictEqual(reqOpts.json, null);

        done();
      };

      instanceGroupManager.getVMs(query, assert.ifError);
    });

    describe('options.running', function() {
      const OPTIONS = {
        running: true,
      };

      it('should set the instanceState filter', function(done) {
        instanceGroupManager.request = function(reqOpts) {
          assert.deepStrictEqual(reqOpts.json, {
            instanceState: 'RUNNING',
          });
          done();
        };

        instanceGroupManager.getVMs(OPTIONS, assert.ifError);
      });
    });

    describe('error', function() {
      const error = new Error('Error.');
      const apiResponse = {a: 'b', c: 'd'};

      beforeEach(function() {
        instanceGroupManager.request = function(reqOpts, callback) {
          callback(error, apiResponse);
        };
      });

      it('should execute callback with error & API response', function(done) {
        instanceGroupManager.getVMs({}, function(
          err,
          vms,
          nextQuery,
          apiResponse_
        ) {
          assert.strictEqual(err, error);
          assert.strictEqual(vms, null);
          assert.strictEqual(nextQuery, null);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });
    });

    describe('success', function() {
      const apiResponse = {
        items: [{instance: 'vm-name'}],
      };

      beforeEach(function() {
        instanceGroupManager.request = function(reqOpts, callback) {
          callback(null, apiResponse);
        };
      });

      it('should build a nextQuery if necessary', function(done) {
        const nextPageToken = 'next-page-token';
        const apiResponseWithNextPageToken = extend({}, apiResponse, {
          nextPageToken: nextPageToken,
        });
        const expectedNextQuery = {
          pageToken: nextPageToken,
        };

        instanceGroupManager.request = function(reqOpts, callback) {
          callback(null, apiResponseWithNextPageToken);
        };

        instanceGroupManager.getVMs({}, function(err, vms, nextQuery) {
          assert.ifError(err);

          assert.deepStrictEqual(nextQuery, expectedNextQuery);

          done();
        });
      });

      it('should execute callback with VMs & API response', function(done) {
        const vm = {};

        instanceGroupManager.zone.vm = function(name) {
          assert.strictEqual(name, apiResponse.items[0].instance);
          return vm;
        };

        instanceGroupManager.getVMs({}, function(
          err,
          vms,
          nextQuery,
          apiResponse_
        ) {
          assert.ifError(err);

          assert.strictEqual(vms[0], vm);
          assert.strictEqual(vms[0].metadata, apiResponse.items[0]);

          assert.strictEqual(apiResponse_, apiResponse);

          done();
        });
      });
    });
  });

  describe('removeVMs', function() {
    it('should make the correct API request', function(done) {
      instanceGroupManager.request = function(reqOpts) {
        assert.strictEqual(reqOpts.method, 'POST');
        assert.strictEqual(reqOpts.uri, '/abandonInstances');

        done();
      };

      instanceGroupManager.removeVMs(assert.ifError);
    });

    describe('error', function() {
      const apiResponse = {};
      const error = new Error('Error.');

      beforeEach(function() {
        instanceGroupManager.request = function(reqOpts, callback) {
          callback(error, apiResponse);
        };
      });

      it('should return an error and API response', function(done) {
        instanceGroupManager.removeVMs(null, function(err, operation, apiResponse_) {
          assert.strictEqual(err, error);
          assert.strictEqual(operation, null);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });
    });

    describe('success', function() {
      const apiResponse = {name: 'op-name'};

      beforeEach(function() {
        instanceGroupManager.request = function(reqOpts, callback) {
          callback(null, apiResponse);
        };
      });

      it('should return an Operation and API response', function(done) {
        const operation = {};

        instanceGroupManager.zone.operation = function(name) {
          assert.strictEqual(name, apiResponse.name);
          return operation;
        };

        instanceGroupManager.removeVMs(null, function(err, operation_, apiResponse_) {
          assert.ifError(err);
          assert.strictEqual(operation_, operation);
          assert.strictEqual(operation.metadata, apiResponse);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });
    });
  });

  describe('recreateVMs', function() {
    const VM = {
      name: 'my-vm',
    };

    const INSTANCES = [VM, 'some/instance'];

    beforeEach(function() {
      fakeUtil.isCustomType = function(instance) {
        return typeof instance === 'object';
      };
    });

    it('should make the correct API request', function(done) {
      const expectedBody = {
        instances: ['zones/my-zone/instances/my-vm', 'some/instance'],
      };

      instanceGroupManager.request = function(reqOpts) {
        assert.strictEqual(reqOpts.method, 'POST');
        assert.strictEqual(reqOpts.uri, '/recreateInstances');
        assert.deepStrictEqual(reqOpts.json, expectedBody);

        done();
      };

      instanceGroupManager.recreateVMs(INSTANCES, assert.ifError);
    });

    describe('error', function() {
      const apiResponse = {};
      const error = new Error('Error.');

      beforeEach(function() {
        instanceGroupManager.request = function(reqOpts, callback) {
          callback(error, apiResponse);
        };
      });

      it('should return an error and API response', function(done) {
        instanceGroupManager.recreateVMs(INSTANCES, function(
          err,
          operation,
          apiResponse_
        ) {
          assert.strictEqual(err, error);
          assert.strictEqual(operation, null);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });
    });

    describe('success', function() {
      const apiResponse = {name: 'op-name'};

      beforeEach(function() {
        instanceGroupManager.request = function(reqOpts, callback) {
          callback(null, apiResponse);
        };
      });

      it('should return an Operation and API response', function(done) {
        const operation = {};

        instanceGroupManager.zone.operation = function(name) {
          assert.strictEqual(name, apiResponse.name);
          return operation;
        };

        instanceGroupManager.recreateVMs(INSTANCES, function(
          err,
          operation_,
          apiResponse_
        ) {
          assert.ifError(err);
          assert.strictEqual(operation_, operation);
          assert.strictEqual(operation.metadata, apiResponse);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });
    });
  });

  describe('resize', function() {
    const SIZE = 10;

    describe('error', function() {
      const error = new Error('Error.');
      const apiResponse = {a: 'b', c: 'd'};

      beforeEach(function() {
        instanceGroupManager.request = function(reqOpts, callback) {
          callback(error, apiResponse);
        };
      });

      it('should return an error if the request fails', function(done) {
        instanceGroupManager.resize(SIZE, function(
          err,
          operation,
          apiResponse_
        ) {
          assert.strictEqual(err, error);
          assert.strictEqual(operation, null);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });

      it('should not require a callback', function() {
        assert.doesNotThrow(function() {
          instanceGroupManager.resize(SIZE);
        });
      });
    });

    describe('success', function() {
      const apiResponse = {
        name: 'op-name',
      };

      beforeEach(function() {
        instanceGroupManager.request = function(reqOpts, callback) {
          callback(null, apiResponse);
        };
      });

      it('should execute callback with Operation & Response', function(done) {
        const operation = {};

        instanceGroupManager.zone.operation = function(name) {
          assert.strictEqual(name, apiResponse.name);
          return operation;
        };

        instanceGroupManager.resize(SIZE, function(
          err,
          operation_,
          apiResponse_
        ) {
          assert.ifError(err);
          assert.strictEqual(operation_, operation);
          assert.strictEqual(operation_.metadata, apiResponse);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });

      it('should not require a callback', function() {
        assert.doesNotThrow(function() {
          instanceGroupManager.resize(SIZE);
        });
      });
    });
  });
});
