// Copyright 2020 Google LLC. All Rights Reserved.
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

const assert = require('assert');
const format = require('string-format-obj');
const proxyquire = require('proxyquire');
const {ServiceObject, util} = require('@google-cloud/common');
const promisify = require('@google-cloud/promisify');

let promisified = false;
const fakePromisify = Object.assign({}, promisify, {
  promisifyAll: function(Class) {
    if (Class.name !== 'InstanceTemplate') {
      return;
    }
    promisified = true;
  },
});

class FakeServiceObject extends ServiceObject {
  constructor(config) {
    super(config);
    this.calledWith_ = arguments;
  }
}

describe('InstanceTemplate', function() {
  let InstanceTemplate;
  let instanceTemplate;

  const COMPUTE = {
    projectId: 'project-id',
    createInstanceTemplate: util.noop,
  };
  const TEMPLATE_NAME = 'template-name';
  const TEMPLATE_FULL_NAME = format(
    'projects/{pId}/global/instanceTemplates/{name}',
    {
      pId: COMPUTE.projectId,
      name: TEMPLATE_NAME,
    }
  );

  before(function() {
    InstanceTemplate = proxyquire('../src/instance-template.js', {
      '@google-cloud/common': {
        ServiceObject: FakeServiceObject,
      },
      '@google-cloud/promisify': fakePromisify,
    });
  });

  beforeEach(function() {
    instanceTemplate = new InstanceTemplate(COMPUTE, TEMPLATE_NAME);
  });

  describe('instantiation', function() {
    it('should promisify all the things', function() {
      assert(promisified);
    });

    it('should localize the compute instance', function() {
      assert.strictEqual(instanceTemplate.compute, COMPUTE);
    });

    it('should localize the name', function() {
      assert.strictEqual(instanceTemplate.name, TEMPLATE_NAME);
    });

    it('should format the template name', function() {
      const formatName_ = InstanceTemplate.formatName_;
      const formattedName =
        'projects/project-id/global/instanceTemplates/template-name';

      InstanceTemplate.formatName_ = function(compute, name) {
        InstanceTemplate.formatName_ = formatName_;

        assert.strictEqual(compute, COMPUTE);
        assert.strictEqual(name, TEMPLATE_NAME);

        return formattedName;
      };

      const template = new InstanceTemplate(COMPUTE, TEMPLATE_NAME);
      assert(template.formattedName, formattedName);
    });

    it('should inherit from ServiceObject', function(done) {
      const computeInstance = Object.assign({}, COMPUTE, {
        createInstanceTemplate: {
          bind: function(context) {
            assert.strictEqual(context, computeInstance);
            done();
          },
        },
      });

      const template = new InstanceTemplate(computeInstance, TEMPLATE_NAME);
      assert(template instanceof ServiceObject);

      const calledWith = template.calledWith_[0];

      assert.strictEqual(calledWith.parent, computeInstance);
      assert.strictEqual(calledWith.baseUrl, '/global/instanceTemplates');
      assert.strictEqual(calledWith.id, TEMPLATE_NAME);
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
      const formattedName_ = InstanceTemplate.formatName_(
        COMPUTE,
        TEMPLATE_NAME
      );
      assert.strictEqual(formattedName_, TEMPLATE_FULL_NAME);
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
      const error = new Error('Error.');
      const apiResponse = {a: 'b', c: 'd'};

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
