// Copyright 2015 Google LLC
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
import {ServiceObject, util} from '@google-cloud/common';
import type {
  BodyResponseCallback,
  DecorateRequestOptions,
  MetadataCallback,
  ServiceObjectConfig,
} from '@google-cloud/common';
import * as promisify from '@google-cloud/promisify';

import type {
  CreateSnapshotOptions,
  Disk as DiskType,
  Snapshot,
  Operation,
  Zone,
} from '../src';

let promisified = false;
const fakePromisify = Object.assign({}, promisify, {
  promisifyAll: function (
    Class: typeof ServiceObject,
    options: promisify.PromisifyAllOptions
  ) {
    if (Class.name !== 'Disk') {
      return;
    }

    promisified = true;
    assert.deepStrictEqual(options.exclude, ['snapshot']);
  },
});

function FakeSnapshot(this: {calledWith_: unknown[]}) {
  // eslint-disable-next-line prefer-rest-params
  this.calledWith_ = [].slice.call(arguments);

  return this;
}

class FakeServiceObject extends ServiceObject {
  calledWith_: IArguments;
  constructor(config: ServiceObjectConfig) {
    super(config);
    // eslint-disable-next-line prefer-rest-params
    this.calledWith_ = arguments;
  }
}

describe('Disk', () => {
  let Disk: typeof DiskType;
  let disk: DiskType;

  const COMPUTE = {
    projectId: 'project-id',
  };

  const ZONE = ({
    compute: COMPUTE,
    name: 'us-central1-a',
    createDisk: util.noop,
  } as unknown) as Zone;

  const DISK_NAME = 'disk-name';
  const DISK_FULL_NAME = `projects/${COMPUTE.projectId}/zones/${ZONE.name}/disks/${DISK_NAME}`;

  before(() => {
    ({Disk} = proxyquire('../src/disk.js', {
      '@google-cloud/common': {
        ServiceObject: FakeServiceObject,
      },
      '@google-cloud/promisify': fakePromisify,
      './snapshot.js': {Snapshot: FakeSnapshot},
    }));
  });

  beforeEach(() => {
    disk = new Disk(ZONE, DISK_NAME);
  });

  describe('instantiation', () => {
    it('should localize the zone', () => {
      assert.strictEqual(disk.zone, ZONE);
    });

    it('should localize the name', () => {
      assert.strictEqual(disk.name, DISK_NAME);
    });

    it('should promisify all the things', () => {
      assert(promisified);
    });

    it('should format the disk name', () => {
      const formatName_ = Disk.formatName_;
      const formattedName = 'projects/a/zones/b/disks/c';

      Disk.formatName_ = function (zone, name) {
        Disk.formatName_ = formatName_;

        assert.strictEqual(zone, ZONE);
        assert.strictEqual(name, DISK_NAME);

        return formattedName;
      };

      const disk = new Disk(ZONE, DISK_NAME);
      assert(disk.formattedName, formattedName);
    });

    it('should inherit from ServiceObject', done => {
      const zoneInstance = Object.assign({}, ZONE, {
        createDisk: {
          bind: function (context: any) {
            assert.strictEqual(context, zoneInstance);
            done();
          },
        },
      });

      const disk = new Disk(zoneInstance, DISK_NAME);
      assert(disk instanceof ServiceObject);

      const calledWith = ((disk as unknown) as FakeServiceObject)
        .calledWith_[0];

      assert.strictEqual(calledWith.parent, zoneInstance);
      assert.strictEqual(calledWith.baseUrl, '/disks');
      assert.strictEqual(calledWith.id, DISK_NAME);
      assert.deepStrictEqual(calledWith.methods, {
        create: true,
        exists: true,
        get: true,
        getMetadata: true,
      });
    });
  });

  describe('formatName_', () => {
    it('should format the name', () => {
      const formattedName_ = Disk.formatName_(ZONE, DISK_NAME);
      assert.strictEqual(formattedName_, DISK_FULL_NAME);
    });
  });

  describe('createSnapshot', () => {
    it('should make the correct API request', done => {
      disk.request = function (reqOpts: DecorateRequestOptions): any {
        assert.strictEqual(reqOpts.method, 'POST');
        assert.strictEqual(reqOpts.uri, '/createSnapshot');
        assert.deepStrictEqual(reqOpts.json, {name: 'test', a: 'b'});
        done();
      };

      disk.createSnapshot(
        'test',
        ({a: 'b'} as unknown) as CreateSnapshotOptions,
        util.noop
      );
    });

    describe('error', () => {
      const error = new Error('Error.');
      const apiResponse = {a: 'b', c: 'd'};

      beforeEach(() => {
        disk.request = function (
          reqOpts: DecorateRequestOptions,
          callback?: BodyResponseCallback
        ): any {
          callback!(error, apiResponse);
        };
      });

      it('should return an error if the request fails', done => {
        disk.createSnapshot('test', {}, (err, snap, op, apiResponse_) => {
          assert.strictEqual(err, error);
          assert.strictEqual(snap, null);
          assert.strictEqual(op, null);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });

      it('should not require options', () => {
        assert.doesNotThrow(() => {
          disk.createSnapshot('test', util.noop);
        });
      });
    });

    describe('success', () => {
      const apiResponse = {
        name: 'op-name',
      };

      beforeEach(() => {
        disk.request = function (
          reqOpts: DecorateRequestOptions,
          callback?: BodyResponseCallback
        ): any {
          callback!(null, apiResponse);
        };
      });

      it('should execute callback with Snapshot & Operation', done => {
        const snapshot = ({} as unknown) as Snapshot;
        const operation = ({} as unknown) as Operation;

        disk.snapshot = function (name) {
          assert.strictEqual(name, 'test');
          return snapshot;
        };

        disk.zone.operation = function (name) {
          assert.strictEqual(name, apiResponse.name);
          return operation;
        };

        disk.createSnapshot('test', {}, (err, snap, op, apiResponse_) => {
          assert.ifError(err);

          assert.strictEqual(snap, snapshot);
          assert.strictEqual(op, operation);
          assert.strictEqual(op!.metadata, apiResponse);
          assert.strictEqual(apiResponse_, apiResponse);

          done();
        });

        it('should not require options', () => {
          assert.doesNotThrow(() => {
            disk.createSnapshot('test', util.noop);
          });
        });
      });
    });
  });

  describe('delete', () => {
    it('should call ServiceObject.delete', done => {
      FakeServiceObject.prototype.request = function (): any {
        assert.strictEqual(this, disk);
        done();
      };

      disk.delete();
    });

    describe('error', () => {
      const error = new Error('Error.');
      const apiResponse = {a: 'b', c: 'd'};

      beforeEach(() => {
        FakeServiceObject.prototype.request = function (
          options: DecorateRequestOptions,
          callback?: MetadataCallback
        ): any {
          callback!(error, apiResponse);
        };
      });

      it('should return an error if the request fails', done => {
        disk.delete((err, operation, apiResponse_) => {
          assert.strictEqual(err, error);
          assert.strictEqual(operation, null);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });

      it('should not require a callback', () => {
        assert.doesNotThrow(() => {
          disk.delete();
        });
      });
    });

    describe('success', () => {
      const apiResponse = {
        name: 'op-name',
      };

      beforeEach(() => {
        FakeServiceObject.prototype.request = function (
          options: DecorateRequestOptions,
          callback?: MetadataCallback
        ): any {
          callback!(null, apiResponse);
        };
      });

      it('should execute callback with Operation & Response', done => {
        const operation = ({} as unknown) as Operation;

        disk.zone.operation = function (name) {
          assert.strictEqual(name, apiResponse.name);
          return operation;
        };

        disk.delete((err, operation_, apiResponse_) => {
          assert.ifError(err);
          assert.strictEqual(operation_, operation);
          assert.strictEqual(operation_!.metadata, apiResponse);
          assert.strictEqual(apiResponse_, apiResponse);
          done();
        });
      });

      it('should not require a callback', () => {
        assert.doesNotThrow(() => {
          disk.delete();
        });
      });
    });
  });

  describe('snapshot', () => {
    const NAME = 'snapshot-name';

    it('should return a Snapshot object', () => {
      const snapshot = disk.snapshot(NAME);
      assert(snapshot instanceof FakeSnapshot);
      assert.strictEqual(
        ((snapshot as unknown) as ReturnType<typeof FakeSnapshot>)
          .calledWith_[0],
        disk
      );
      assert.strictEqual(
        ((snapshot as unknown) as ReturnType<typeof FakeSnapshot>)
          .calledWith_[1],
        NAME
      );
    });
  });
});
