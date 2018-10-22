/**
 * Copyright 2018, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const tools = require(`@google-cloud/nodejs-repo-tools`);
const uuid = require('uuid');
const assert = require('assert');

const example = require(`../index`);


describe('start-up script',() =>{
  before(tools.checkCredentials);
  beforeEach(tools.stubConsole);
  afterEach(tools.restoreConsole);

  it('should list vms', () => {
      example.list((err, result) => {
        assert.ifError(err);
        assert.ok(result);
        assert.strictEqual(Array.isArray(result),true);
      });
  });

  
  it('should create vm', () => {
    const TESTS_PREFIX = 'gcloud-tests-';
    const name = generateName('vm-with-apache');

    function generateName(customPrefix) {
      return [TESTS_PREFIX, customPrefix + '-', uuid.v4().replace('-', '')]
        .join('')
        .substr(0, 61);
    }

    example.create(name, (err, result) => {
      assert.ifError(err);
      assert.ok(result);

      // Clean up newly created vm.
      example.delete(name, (err, result) => {
        assert.ifError(err);
        assert.ok(result);
       
      });
    });
  });

});
