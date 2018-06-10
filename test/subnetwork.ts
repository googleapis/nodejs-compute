/**
 * Copyright 2016 Google Inc. All Rights Reserved.
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
    if (Class.name === 'Subnetwork') {
      promisified = true;
    }
  },
});

function FakeServiceObject() {
  this.calledWith_ = arguments;
  ServiceObject.apply(this, arguments);
}

nodeutil.inherits(FakeServiceObject, ServiceObject);

describe('Subnetwork', function() {
  var Subnetwork;
  var subnetwork;

  var SUBNETWORK_NAME = 'subnetwork_name';
  var REGION_NAME = 'region-1';
  var REGION = {
    createSubnetwork: util.noop,
    name: REGION_NAME,
  };

  before(function() {
    Subnetwork = proxyquire('../src/subnetwork.js', {
      '@google-cloud/common': {
        ServiceObject: FakeServiceObject,
        util: fakeUtil,
      },
    });
  });

  beforeEach(function() {
    subnetwork = new Subnetwork(REGION, SUBNETWORK_NAME);
  });

  describe('instantiation', function() {
    it('should localize the name', function() {
      assert.strictEqual(subnetwork.name, SUBNETWORK_NAME);
    });

    it('should localize the region', function() {
      assert.strictEqual(subnetwork.region, REGION);
    });

    it('should inherit from ServiceObject', function() {
      var createSubnetworkBound = {};

      var regionInstance = extend({}, REGION, {
        createSubnetwork: {
          bind: function(context) {
            assert.strictEqual(context, regionInstance);
            return createSubnetworkBound;
          },
        },
      });

      var subnetwork = new Subnetwork(regionInstance, SUBNETWORK_NAME);
      assert(subnetwork instanceof ServiceObject);

      var calledWith = subnetwork.calledWith_[0];

      assert.strictEqual(calledWith.parent, regionInstance);
      assert.strictEqual(calledWith.baseUrl, '/subnetworks');
      assert.strictEqual(calledWith.id, SUBNETWORK_NAME);
      assert.strictEqual(calledWith.createMethod, createSubnetworkBound);
      assert.deepEqual(calledWith.methods, {
        create: true,
        exists: true,
        get: true,
        getMetadata: true,
      });
    });

    it('should promisify all the things', function() {
      assert(promisified);
    });
  });

  describe('delete', function() {
    it('should make the correct API request', function(done) {
      subnetwork.request = function(reqOpts) {
        assert.strictEqual(reqOpts.method, 'DELETE');
        assert.strictEqual(reqOpts.uri, '');
        done();
      };

      subnetwork.delete(assert.ifError);
    });

    describe('error', function() {
      var error = new Error('Error.');
      var apiResponse = {a: 'b', c: 'd'};

      beforeEach(function() {
        subnetwork.request = function(reqOpts, callback) {
          callback(error, apiResponse);
        };
      });

      it('should return an error if the request fails', function(done) {
        subnetwork.delete(function(err, operation, apiResponse_) {
          assert.strictEqual(err, error);
          assert.strictEqual(operation, null);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });

      it('should not require a callback', function() {
        assert.doesNotThrow(function() {
          subnetwork.delete();
        });
      });
    });

    describe('success', function() {
      var apiResponse = {
        name: 'op-name',
      };

      beforeEach(function() {
        subnetwork.request = function(reqOpts, callback) {
          callback(null, apiResponse);
        };
      });

      it('should execute callback with Operation & Response', function(done) {
        var operation = {};

        subnetwork.region.operation = function(name) {
          assert.strictEqual(name, apiResponse.name);
          return operation;
        };

        subnetwork.delete(function(err, operation_, apiResponse_) {
          assert.ifError(err);
          assert.strictEqual(operation_, operation);
          assert.strictEqual(operation_.metadata, apiResponse);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });

      it('should not require a callback', function() {
        assert.doesNotThrow(function() {
          subnetwork.delete();
        });
      });
    });
  });
});
