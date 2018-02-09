/**
 * Copyright 2017 Google Inc. All Rights Reserved.
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
var proxyquire = require('proxyquire');
var format = require('string-format-obj');
var util = require('@google-cloud/common').util;

var isCustomTypeOverride;
var promisified = false;
var fakeUtil = extend({}, util, {
  isCustomType: function() {
    return (isCustomTypeOverride || util.isCustomType).apply(null, arguments);
  },
  promisifyAll: function(Class) {
    if (Class.name === 'Project') {
      promisified = true;
    }
  },
});

function FakeServiceObject() {
  this.calledWith_ = arguments;
}

describe('Project', function() {
  var Project;
  var project;

  var PROJECT_ID = 'project-1';
  var COMPUTE = {
    projectId: PROJECT_ID,
    authConfig: {a: 'b', c: 'd'},
  };

  before(function() {
    Project = proxyquire('../src/project.js', {
      '@google-cloud/common': {
        ServiceObject: FakeServiceObject,
        util: fakeUtil,
      },
    });
  });

  beforeEach(function() {
    isCustomTypeOverride = null;
    project = new Project(COMPUTE);
  });

  describe('instantiation', function() {
    it('should promisify all the things', function() {
      assert(promisified);
    });

    it('should localize the ID', function() {
      assert.strictEqual(project.id, PROJECT_ID);
    });

    it('should inherit from ServiceObject', function() {
      assert(project instanceof FakeServiceObject);

      var calledWith = project.calledWith_[0];

      assert.strictEqual(calledWith.parent, COMPUTE);
      assert.strictEqual(calledWith.baseUrl, '');
      assert.strictEqual(calledWith.id, '');
      assert.deepStrictEqual(calledWith.methods, {
        get: true,
        getMetadata: true,
      });
    });
  });

  describe('createImage', function() {
    var NAME = 'image-name';

    var DISK = {
      name: 'disk-name',
      zone: {
        name: 'zone-name',
      },
    };

    beforeEach(function() {
      isCustomTypeOverride = function() {
        return true;
      };

      project.request = util.noop;
    });

    it('should throw if Disk is not provided', function() {
      isCustomTypeOverride = function(unknown, type) {
        assert.strictEqual(unknown, DISK);
        assert.strictEqual(type, 'Disk');
        return false;
      };

      assert.throws(function() {
        project.createImage(NAME, DISK);
      }, /A Disk object is required\./);
    });

    it('should make the correct API request', function(done) {
      project.request = function(reqOpts) {
        assert.strictEqual(reqOpts.method, 'POST');
        assert.strictEqual(reqOpts.uri, '/global/images');
        assert.deepEqual(reqOpts.json, {
          name: NAME,
          sourceDisk: format('zones/{zoneName}/disks/{diskName}', {
            zoneName: DISK.zone.name,
            diskName: DISK.name,
          }),
        });

        done();
      };

      project.createImage(NAME, DISK);
    });

    it('should accept options', function(done) {
      var options = {
        a: 1,
        b: 2,
      };

      project.request = function(reqOpts) {
        var json = reqOpts.json;
        assert.strictEqual(reqOpts.json.a, options.a);
        assert.strictEqual(reqOpts.json.b, options.b);
        done();
      };

      project.createImage(NAME, DISK, options);
    });

    it('should not require options', function() {
      assert.doesNotThrow(function() {
        project.createImage(NAME, DISK, assert.ifError);
      });
    });
  });
});
