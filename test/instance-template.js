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

var assert = require('assert');
var extend = require('extend');
var nodeutil = require('util');
var proxyquire = require('proxyquire');
var ServiceObject = require('@google-cloud/common').ServiceObject;
var util = require('@google-cloud/common').util;

var promisified = false;
var fakeUtil = extend({}, util, {
  promisifyAll: function(Class) {
    if (Class.name === 'InstanceTemplate') {
      promisified = true;
    }
  },
});

function FakeServiceObject() {
  this.calledWith_ = arguments;
  ServiceObject.apply(this, arguments);
}

nodeutil.inherits(FakeServiceObject, ServiceObject);

describe('InstanceTemplate', function() {
  var InstanceTemplate;
  var instanceTemplate;

  var COMPUTE = {
    projectId: 'project-id',
    createInstanceTemplate: util.noop,
    operation: util.noop,
  };
  var INSTANCE_TEMPLATE_NAME = 'my-instance-template';

  before(function() {
    InstanceTemplate = proxyquire('../src/instance-template.js', {
      '@google-cloud/common': {
        ServiceObject: FakeServiceObject,
        util: fakeUtil,
      },
    });
  });

  beforeEach(function() {
    instanceTemplate = new InstanceTemplate(COMPUTE, INSTANCE_TEMPLATE_NAME);
    instanceTemplate.parent = COMPUTE;
  });

  describe('instantiation', function() {
    it('should localize the name', function() {
      assert.strictEqual(instanceTemplate.name, INSTANCE_TEMPLATE_NAME);
    });

    it('should promisify all the things', function() {
      assert(promisified);
    });

    it('should inherit from ServiceObject', function(done) {
      var instanceTemplate = new InstanceTemplate(
        COMPUTE,
        INSTANCE_TEMPLATE_NAME
      );
      assert(instanceTemplate instanceof ServiceObject);

      var calledWith = instanceTemplate.calledWith_[0];

      assert.strictEqual(calledWith.parent, COMPUTE);
      assert.strictEqual(calledWith.baseUrl, '/global/instanceTemplates');
      assert.strictEqual(calledWith.id, INSTANCE_TEMPLATE_NAME);
      assert.deepStrictEqual(calledWith.methods, {
        create: true,
        exists: true,
        get: true,
        getMetadata: true,
      });
      done();
    });
  });

  describe('delete', function() {
    it('should call ServiceObject.delete', function(done) {
      FakeServiceObject.prototype.delete = function() {
        assert.strictEqual(this, instanceTemplate);
        done();
      };

      instanceTemplate.delete();
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
        instanceTemplate.delete(function(err, operation, apiResponse_) {
          assert.strictEqual(err, error);
          assert.strictEqual(operation, null);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });

      it('should not require a callback', function() {
        assert.doesNotThrow(function() {
          instanceTemplate.delete();
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

        instanceTemplate.compute.operation = function(name) {
          assert.strictEqual(name, apiResponse.name);
          return operation;
        };

        instanceTemplate.delete(function(err, operation_, apiResponse_) {
          assert.ifError(err);
          assert.strictEqual(operation_, operation);
          assert.strictEqual(operation_.metadata, apiResponse);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });

      it('should not require a callback', function() {
        assert.doesNotThrow(function() {
          instanceTemplate.delete();
        });
      });
    });
  });
});
