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

var promisified = false;
var fakeUtil = extend({}, util, {
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
  var Disk;
  var disk;

  var PROJECT_ID = 'project-1';
  var COMPUTE = {
    projectId: PROJECT_ID,
    authConfig: {a: 'b', c: 'd'},
  };
  var ZONE = {
    compute: COMPUTE,
    name: 'us-central1-a',
    createDisk: util.noop,
  };

  before(function() {
    Project = proxyquire('../src/project.js', {
      '@google-cloud/common': {
        ServiceObject: FakeServiceObject,
        util: fakeUtil,
      },
    });
    Disk = require('../src/disk.js');
  });

  beforeEach(function() {
    project = new Project(COMPUTE);
    disk = new Disk(ZONE, 'disk1');
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

  describe('image', function() {
    it('should throw an error if no disk instance is provided', function() {
      assert.throws(function() {
        project.createImage('image1', {});
      }, /A Disk object is required\./);

      project.request = util.noop;
      assert.doesNotThrow(function() {
        project.createImage('image2', disk);
      });
    });

    it('should use the correct parameters for making the remote call', function() {
      project.request = function(reqOpts) {
        assert.strictEqual(reqOpts.method, 'POST');
        assert.strictEqual(reqOpts.uri, '/global/images');
        assert.deepEqual(reqOpts.json, {
          name: 'image3',
          sourceDisk: format('zones/{zoneName}/disks/{diskName}', {
            zoneName: disk.zone.name,
            diskName: disk.name,
          }),
        });
      };
      project.createImage('image3', disk);
    });

    it('should pass optional options', function() {
      var options = {
        a: 1,
        b: 2,
      };
      project.request = function(reqOpts) {
        var json = reqOpts.json;
        assert.ok(json.a, 'The option "a" is not passed');
        assert.ok(json.b, 'The option "b" is not passed');
        assert.strictEqual(Object.keys(json).length, 4);
      };
      project.createImage('image4', disk, options);
    });

    it('should use default options if callback is provided', function() {
      project.request = function(reqOpts) {
        var json = reqOpts.json;
        assert.ok(json.name, 'The option "name" is not passed');
        assert.ok(json.sourceDisk, 'The option "sourceDisk" is not passed');
        assert.strictEqual(Object.keys(json).length, 2);
      };
      project.createImage('image5', disk, util.noop);
    });

    it('should not require options', function() {
      project.request = function(reqOpts) {
        assert.strictEqual(Object.keys(reqOpts.json).length, 2);
      };
      assert.doesNotThrow(function() {
        project.createImage('image6', disk);
      });
    });
  });
});
