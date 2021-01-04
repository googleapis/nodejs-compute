// Copyright 2017 Google LLC
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
import * as promisify from '@google-cloud/promisify';
import type {ServiceObject} from '@google-cloud/common';

import type {Compute, Project as ProjectType} from '../src';

let promisified = false;
const fakePromisify = Object.assign({}, promisify, {
  promisifyAll: function (Class: typeof ServiceObject) {
    if (Class.name === 'Project') {
      promisified = true;
    }
  },
});

class FakeServiceObject {
  calledWith_: IArguments;
  constructor() {
    // eslint-disable-next-line prefer-rest-params
    this.calledWith_ = arguments;
  }
}

describe('Project', () => {
  let Project: typeof ProjectType;
  let project: ProjectType;

  const PROJECT_ID = 'project-1';
  const COMPUTE = ({
    projectId: PROJECT_ID,
    authConfig: {a: 'b', c: 'd'},
  } as unknown) as Compute;

  before(() => {
    ({Project} = proxyquire('../src/project.js', {
      '@google-cloud/common': {
        ServiceObject: FakeServiceObject,
      },
      '@google-cloud/promisify': fakePromisify,
    }));
  });

  beforeEach(() => {
    project = new Project(COMPUTE);
  });

  describe('instantiation', () => {
    it('should promisify all the things', () => {
      assert(promisified);
    });

    it('should inherit from ServiceObject', () => {
      assert(project instanceof FakeServiceObject);

      const calledWith = ((project as unknown) as FakeServiceObject)
        .calledWith_[0];

      assert.strictEqual(calledWith.parent, COMPUTE);
      assert.strictEqual(calledWith.baseUrl, '');
      assert.strictEqual(calledWith.id, '');
      assert.deepStrictEqual(calledWith.methods, {
        get: true,
        getMetadata: true,
      });
    });
  });
});
