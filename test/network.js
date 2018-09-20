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

const assert = require('assert');
const extend = require('extend');
const format = require('string-format-obj');
const nodeutil = require('util');
const proxyquire = require('proxyquire');
const ServiceObject = require('@google-cloud/common').ServiceObject;
const util = require('@google-cloud/common').util;

let promisified = false;
const fakeUtil = extend({}, util, {
  promisifyAll: function(Class, options) {
    if (Class.name !== 'Network') {
      return;
    }

    promisified = true;
    assert.deepStrictEqual(options.exclude, ['firewall']);
  },
});

function FakeServiceObject() {
  this.calledWith_ = arguments;
  ServiceObject.apply(this, arguments);
}

nodeutil.inherits(FakeServiceObject, ServiceObject);

describe('Network', function() {
  let Network;
  let network;

  /* eslint-disable no-unused-vars */
  let REGION;
  let Region;

  const COMPUTE = {
    projectId: 'project-id',
    createNetwork: util.noop,
  };
  const NETWORK_NAME = 'network-name';
  const NETWORK_FULL_NAME = format('projects/{pId}/global/networks/{name}', {
    pId: COMPUTE.projectId,
    name: NETWORK_NAME,
  });
  const REGION_NAME = 'region-name';

  before(function() {
    Network = proxyquire('../src/network.js', {
      '@google-cloud/common': {
        ServiceObject: FakeServiceObject,
        util: fakeUtil,
      },
    });

    Region = require('../src/region.js');
  });

  beforeEach(function() {
    network = new Network(COMPUTE, NETWORK_NAME);
    REGION = new Region(COMPUTE, REGION_NAME);
  });

  describe('instantiation', function() {
    it('should promisify all the things', function() {
      assert(promisified);
    });

    it('should localize the compute instance', function() {
      assert.strictEqual(network.compute, COMPUTE);
    });

    it('should localize the name', function() {
      assert.strictEqual(network.name, NETWORK_NAME);
    });

    it('should format the network name', function() {
      const formatName_ = Network.formatName_;
      const formattedName = 'projects/a/global/networks/b';

      Network.formatName_ = function(compute, name) {
        Network.formatName_ = formatName_;

        assert.strictEqual(compute, COMPUTE);
        assert.strictEqual(name, NETWORK_NAME);

        return formattedName;
      };

      const network = new Network(COMPUTE, NETWORK_NAME);
      assert(network.formattedName, formattedName);
    });

    it('should inherit from ServiceObject', function(done) {
      const computeInstance = extend({}, COMPUTE, {
        createNetwork: {
          bind: function(context) {
            assert.strictEqual(context, computeInstance);
            done();
          },
        },
      });

      const network = new Network(computeInstance, NETWORK_NAME);
      assert(network instanceof ServiceObject);

      const calledWith = network.calledWith_[0];

      assert.strictEqual(calledWith.parent, computeInstance);
      assert.strictEqual(calledWith.baseUrl, '/global/networks');
      assert.strictEqual(calledWith.id, NETWORK_NAME);
      assert.deepStrictEqual(calledWith.methods, {
        create: true,
        exists: true,
        get: true,
        getMetadata: true,
      });
    });
  });

  describe('formatName_', function() {
    it('should format the name', function() {
      const formattedName_ = Network.formatName_(COMPUTE, NETWORK_NAME);
      assert.strictEqual(formattedName_, NETWORK_FULL_NAME);
    });
  });

  describe('createFirewall', function() {
    it('should make the correct call to Compute', function(done) {
      const name = 'firewall-name';
      const config = {a: 'b', c: 'd'};
      const expectedConfig = extend({}, config, {
        network: network.formattedName,
      });

      network.compute.createFirewall = function(name_, config_, callback) {
        assert.strictEqual(name_, name);
        assert.deepStrictEqual(config_, expectedConfig);
        callback();
      };

      network.createFirewall(name, config, done);
    });
  });

  describe('createSubnetwork', function() {
    it('should call region.createSubnetwork correctly', function(done) {
      const name = 'subnetwork-name';
      const region = {};
      const config = {
        a: 'b',
        c: 'd',
        region: REGION_NAME,
      };

      const expectedConfig = extend({}, config, {
        network: network.formattedName,
      });
      delete expectedConfig.region;

      network.compute.region = function(name) {
        assert.strictEqual(name, REGION_NAME);
        return region;
      };

      region.createSubnetwork = function(name_, config, callback) {
        assert.strictEqual(name_, name);
        assert.deepStrictEqual(config, expectedConfig);

        callback(); // done();
      };

      network.createSubnetwork(name, config, done);
    });
  });

  describe('delete', function() {
    it('should call ServiceObject.delete', function(done) {
      FakeServiceObject.prototype.delete = function() {
        assert.strictEqual(this, network);
        done();
      };

      network.delete();
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
        network.delete(function(err, operation, apiResponse_) {
          assert.strictEqual(err, error);
          assert.strictEqual(operation, null);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });

      it('should not require a callback', function() {
        assert.doesNotThrow(function() {
          network.delete();
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

        network.compute.operation = function(name) {
          assert.strictEqual(name, apiResponse.name);
          return operation;
        };

        network.delete(function(err, operation_, apiResponse_) {
          assert.ifError(err);
          assert.strictEqual(operation_, operation);
          assert.strictEqual(operation_.metadata, apiResponse);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });

      it('should not require a callback', function() {
        assert.doesNotThrow(function() {
          network.delete();
        });
      });
    });
  });

  describe('firewall', function() {
    it('should return a Firewall with the correct metadata', function() {
      const name = 'firewall-name';
      const firewall = {};

      network.compute.firewall = function(name_) {
        assert.strictEqual(name_, name);
        return firewall;
      };

      const firewallInstance = network.firewall(name);
      assert.deepStrictEqual(firewallInstance.metadata, {
        network: network.formattedName,
      });
    });
  });

  describe('getFirewalls', function() {
    it('should make the correct call to Compute', function(done) {
      const options = {a: 'b', c: 'd'};
      const expectedOptions = extend({}, options, {
        filter: 'network eq .*' + network.formattedName,
      });

      network.compute.getFirewalls = function(options, callback) {
        assert.deepStrictEqual(options, expectedOptions);
        callback();
      };

      network.getFirewalls(options, done);
    });

    it('should not require options', function(done) {
      network.compute.getFirewalls = function(options, callback) {
        callback();
      };

      network.getFirewalls(done);
    });
  });

  describe('getFirewallsStream', function() {
    it('should call to getFirewallsStream correctly', function(done) {
      const options = {a: 'b', c: 'd'};
      const expectedOptions = extend({}, options, {
        filter: 'network eq .*' + network.formattedName,
      });

      network.compute.getFirewallsStream = function(options) {
        assert.deepStrictEqual(options, expectedOptions);
        done();
      };

      network.getFirewallsStream(options);
    });

    it('should not require options', function(done) {
      network.compute.getFirewallsStream = function() {
        done();
      };

      network.getFirewallsStream();
    });

    it('should return a stream', function(done) {
      const fakeStream = {};

      network.compute.getFirewallsStream = function() {
        setImmediate(done);
        return fakeStream;
      };

      const stream = network.getFirewallsStream();
      assert.strictEqual(stream, fakeStream);
    });
  });

  describe('getSubnetworks', function() {
    it('should call to compute.getSubnetworks correctly', function(done) {
      const options = {a: 'b', c: 'd'};
      const expectedOptions = extend({}, options, {
        filter: 'network eq .*' + network.formattedName,
      });

      network.compute.getSubnetworks = function(options, callback) {
        assert.deepStrictEqual(options, expectedOptions);
        callback();
      };

      network.getSubnetworks(options, done);
    });

    it('should not require options', function(done) {
      network.compute.getSubnetworks = function(options, callback) {
        callback();
      };

      network.getSubnetworks(done);
    });
  });

  describe('getSubnetworksStream', function() {
    it('should call to getSubnetworksStream correctly', function(done) {
      const options = {a: 'b', c: 'd'};
      const expectedOptions = extend({}, options, {
        filter: 'network eq .*' + network.formattedName,
      });

      network.compute.getSubnetworksStream = function(options) {
        assert.deepStrictEqual(options, expectedOptions);
        done();
      };

      network.getSubnetworksStream(options);
    });

    it('should not require options', function(done) {
      network.compute.getSubnetworksStream = function() {
        done();
      };

      network.getSubnetworksStream();
    });

    it('should return a stream', function(done) {
      const fakeStream = {};

      network.compute.getSubnetworksStream = function() {
        setImmediate(done);
        return fakeStream;
      };

      const stream = network.getSubnetworksStream();
      assert.strictEqual(stream, fakeStream);
    });
  });
});
