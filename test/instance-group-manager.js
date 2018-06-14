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

var arrify = require('arrify');
var assert = require('assert');
var extend = require('extend');
var nodeutil = require('util');
var proxyquire = require('proxyquire');

var ServiceObject = require('@google-cloud/common').ServiceObject;
var util = require('@google-cloud/common').util;

var promisified = false;
var fakeUtil = extend({}, util, {
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

var extended = false;
var fakePaginator = {
  extend: function(Class, methods) {
    if (Class.name !== 'InstanceGroupManager') {
      return;
    }

    extended = true;
    methods = arrify(methods);
    assert.equal(Class.name, 'InstanceGroupManager');
    assert.deepEqual(methods, ['getVMs']);
  },
  streamify: function(methodName) {
    return methodName;
  },
};

describe('InstanceGroupManager', function() {
  var InstanceGroupManager;
  var instanceGroupManager;

  var staticMethods = {};

  var ZONE = {
    createInstanceGroupManager: util.noop,
    vm: util.noop,
  };
  var NAME = 'instance-group-manager-name';

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
      var instanceGroupManager;

      var zoneInstance = extend({}, ZONE, {
        createInstanceGroupManager: {
          bind: function(context) {
            assert.strictEqual(context, zoneInstance);

            setImmediate(function() {
              assert(instanceGroupManager instanceof ServiceObject);

              var calledWith = instanceGroupManager.calledWith_[0];

              assert.strictEqual(calledWith.parent, zoneInstance);
              assert.strictEqual(calledWith.baseUrl, '/instanceGroupManagers');
              assert.strictEqual(calledWith.id, NAME);
              assert.deepEqual(calledWith.methods, {
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
      var error = new Error('Error.');
      var apiResponse = {a: 'b', c: 'd'};

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
      var apiResponse = {
        name: 'op-name',
      };

      beforeEach(function() {
        FakeServiceObject.prototype.delete = function(callback) {
          callback(null, apiResponse);
        };
      });

      it('should execute callback with Operation & Response', function(done) {
        var operation = {};

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
        assert.deepEqual(reqOpts.qs, {});
        done();
      };

      instanceGroupManager.getVMs(assert.ifError);
    });

    it('should make the correct API request', function(done) {
      var query = {a: 'b', c: 'd'};

      instanceGroupManager.request = function(reqOpts) {
        assert.strictEqual(reqOpts.method, 'POST');
        assert.strictEqual(reqOpts.uri, '/listManagedInstances');
        assert.strictEqual(reqOpts.qs, query);
        assert.strictEqual(reqOpts.json, undefined);

        done();
      };

      instanceGroupManager.getVMs(query, assert.ifError);
    });

    describe('options.running', function() {
      var OPTIONS = {
        running: true,
      };

      it('should set the instanceState filter', function(done) {
        instanceGroupManager.request = function(reqOpts) {
          assert.deepEqual(reqOpts.json, {
            instanceState: 'RUNNING',
          });
          done();
        };

        instanceGroupManager.getVMs(OPTIONS, assert.ifError);
      });
    });

    describe('error', function() {
      var error = new Error('Error.');
      var apiResponse = {a: 'b', c: 'd'};

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
      var apiResponse = {
        items: [{instance: 'vm-name'}],
      };

      beforeEach(function() {
        instanceGroupManager.request = function(reqOpts, callback) {
          callback(null, apiResponse);
        };
      });

      it('should build a nextQuery if necessary', function(done) {
        var nextPageToken = 'next-page-token';
        var apiResponseWithNextPageToken = extend({}, apiResponse, {
          nextPageToken: nextPageToken,
        });
        var expectedNextQuery = {
          pageToken: nextPageToken,
        };

        instanceGroupManager.request = function(reqOpts, callback) {
          callback(null, apiResponseWithNextPageToken);
        };

        instanceGroupManager.getVMs({}, function(err, vms, nextQuery) {
          assert.ifError(err);

          assert.deepEqual(nextQuery, expectedNextQuery);

          done();
        });
      });

      it('should execute callback with VMs & API response', function(done) {
        var vm = {};

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
      var apiResponse = {};
      var error = new Error('Error.');

      beforeEach(function() {
        instanceGroupManager.request = function(reqOpts, callback) {
          callback(error, apiResponse);
        };
      });

      it('should return an error and API response', function(done) {
        instanceGroupManager.removeVMs(function(err, operation, apiResponse_) {
          assert.strictEqual(err, error);
          assert.strictEqual(operation, null);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });
    });

    describe('success', function() {
      var apiResponse = {name: 'op-name'};

      beforeEach(function() {
        instanceGroupManager.request = function(reqOpts, callback) {
          callback(null, apiResponse);
        };
      });

      it('should return an Operation and API response', function(done) {
        var operation = {};

        instanceGroupManager.zone.operation = function(name) {
          assert.strictEqual(name, apiResponse.name);
          return operation;
        };

        instanceGroupManager.removeVMs(function(err, operation_, apiResponse_) {
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
    it('should make the correct API request', function(done) {
      instanceGroupManager.request = function(reqOpts) {
        assert.strictEqual(reqOpts.method, 'POST');
        assert.strictEqual(reqOpts.uri, '/recreateInstances');

        done();
      };

      instanceGroupManager.recreateVMs(assert.ifError);
    });

    describe('error', function() {
      var apiResponse = {};
      var error = new Error('Error.');

      beforeEach(function() {
        instanceGroupManager.request = function(reqOpts, callback) {
          callback(error, apiResponse);
        };
      });

      it('should return an error and API response', function(done) {
        instanceGroupManager.recreateVMs(function(
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
      var apiResponse = {name: 'op-name'};

      beforeEach(function() {
        instanceGroupManager.request = function(reqOpts, callback) {
          callback(null, apiResponse);
        };
      });

      it('should return an Operation and API response', function(done) {
        var operation = {};

        instanceGroupManager.zone.operation = function(name) {
          assert.strictEqual(name, apiResponse.name);
          return operation;
        };

        instanceGroupManager.recreateVMs(function(
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
    var SIZE = 10;

    describe('error', function() {
      var error = new Error('Error.');
      var apiResponse = {a: 'b', c: 'd'};

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
      var apiResponse = {
        name: 'op-name',
      };

      beforeEach(function() {
        instanceGroupManager.request = function(reqOpts, callback) {
          callback(null, apiResponse);
        };
      });

      it('should execute callback with Operation & Response', function(done) {
        var operation = {};

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
