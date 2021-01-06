/*!
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
import {ServiceObject, util} from '@google-cloud/common';
import type {Metadata} from '@google-cloud/common';
import {promisifyAll} from '@google-cloud/promisify';
import type {Image} from 'gce-images';

import type {
  BaseOptions,
  CryptKey,
  GuestOsFeatures,
  Labeled,
} from './interfaces';
import type {CreateResourceCallback, OperationCallback} from './operation';
import {Snapshot} from './snapshot';
import type {Zone} from './zone';

export interface CreateDiskOptions2 extends BaseOptions, Labeled {
  sizeGb?: string;
  sourceSnapshot?: string;
  sourceImage?: string | Image;
  type?: string;
  guestOsFeatures?: GuestOsFeatures[];
  diskEncryptionKey?: CryptKey;
  sourceImageEncryptionKey?: CryptKey;
  sourceSnapshotEncryptionKey?: CryptKey;
  replicaZones?: string[];
  licenseCodes?: string[];
  physicalBlockSizeBytes?: string;
  resourcePolicies?: string[];
  sourceDisk?: string;
}
export interface CreateSnapshotOptions extends BaseOptions, Labeled {
  sourceDisk?: string;
  snapshotEncryptionKey?: CryptKey;
  sourceDiskEncryptionKey?: CryptKey;
  storageLocation?: string[];
  chainName?: string;
}
export interface CreateDiskOptions {
  type?: 'SCRATCH' | 'PERSISTENT';
  mode?: 'READ_WRITE' | 'READ_ONLY';
  source?: string;
  deviceName?: string;
  boot?: boolean;
  initializeParams?: {
    diskName?: string;
    sourceImage?: string;
    diskSizeGb?: string;
    diskType?: string;
    sourceImageEncryptionKey?: CryptKey;
    labels?: Record<string, string>;
    sourceSnapshot?: string;
    sourceSnapshotEncryptionKey?: CryptKey;
    description?: string;
    resourcePolicies?: string[];
    onUpdateAction?: string;
  };
  autoDelete?: boolean;
  interface?: 'SCSI' | 'NVME';
  guestOsFeatures?: GuestOsFeatures[];
  diskEncryptionKey?: CryptKey;
  diskSizeGb?: string;
}

/**
 * A Disk object allows you to interact with a Google Compute Engine disk.
 *
 * @see [Disks Overview]{@link https://cloud.google.com/compute/docs/disks}
 * @see [Disk Resource]{@link https://cloud.google.com/compute/docs/reference/v1/disks}
 *
 * @class
 * @param {Zone} zone
 * @param {string} name
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('us-central1-a');
 * const disk = zone.disk('disk1');
 */
export class Disk extends ServiceObject {
  name: string;
  zone: Zone;
  formattedName: string;
  constructor(zone: Zone, name: string) {
    const methods = {
      /**
       * Create a persistent disk.
       *
       * @method Disk#create
       * @param {object} config - See {@link Zone#createDisk}.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const zone = compute.zone('us-central1-a');
       * const disk = zone.disk('disk1');
       *
       * const config = {
       *   // ...
       * };
       *
       * disk.create(config, function(err, disk, operation, apiResponse) {
       *   // `disk` is a Disk object.
       *
       *   // `operation` is an Operation object that can be used to check the
       *   // status of the request.
       * });
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * disk.create(config).then(function(data) {
       *   const disk = data[0];
       *   const operation = data[1];
       *   const apiResponse = data[2];
       * });
       */
      create: true,
      /**
       * Check if the disk exists.
       *
       * @method Disk#exists
       * @param {function} callback - The callback function.
       * @param {?error} callback.err - An error returned while making this
       *     request.
       * @param {boolean} callback.exists - Whether the disk exists or not.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const zone = compute.zone('us-central1-a');
       * const disk = zone.disk('disk1');
       *
       * disk.exists(function(err, exists) {});
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * disk.exists().then(function(data) {
       *   const exists = data[0];
       * });
       */
      exists: true,
      /**
       * Get a disk if it exists.
       *
       * You may optionally use this to "get or create" an object by providing an
       * object with `autoCreate` set to `true`. Any extra configuration that is
       * normally required for the `create` method must be contained within this
       * object as well.
       *
       * @method Disk#get
       * @param {options=} options - Configuration object.
       * @param {boolean} options.autoCreate - Automatically create the object if
       *     it does not exist. Default: `false`
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const zone = compute.zone('us-central1-a');
       * const disk = zone.disk('disk1');
       *
       * disk.get(function(err, disk, apiResponse) {
       *   // `disk` is a Disk object.
       * });
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * disk.get().then(function(data) {
       *   const disk = data[0];
       *   const apiResponse = data[1];
       * });
       */
      get: true,
      /**
       * Get the disk's metadata.
       *
       * @method Disk#getMetadata
       * @see [Disk Resource]{@link https://cloud.google.com/compute/docs/reference/v1/disks}
       * @see [Disks: get API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/disks/get}
       *
       * @param {function=} callback - The callback function.
       * @param {?error} callback.err - An error returned while making this
       *     request.
       * @param {object} callback.metadata - The disk's metadata.
       * @param {object} callback.apiResponse - The full API response.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const zone = compute.zone('us-central1-a');
       * const disk = zone.disk('disk1');
       *
       * disk.getMetadata(function(err, metadata, apiResponse) {});
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * disk.getMetadata().then(function(data) {
       *   const metadata = data[0];
       *   const apiResponse = data[1];
       * });
       */
      getMetadata: true,
    };
    super({
      parent: zone,
      baseUrl: '/disks',
      /**
       * @name Disk#id
       * @type {string}
       */
      id: name,
      createMethod: zone.createDisk.bind(zone),
      methods: methods,
      pollIntervalMs: zone.compute.pollIntervalMs,
    });
    /**
     * @name Disk#name
     * @type {string}
     */
    this.name = name;
    /**
     * The parent {@link Zone} instance of this {@link Disk} instance.
     * @name Disk#zone
     * @type {Zone}
     */
    this.zone = zone;
    /**
     * @name Disk#formattedName
     * @type {string}
     */
    this.formattedName = Disk.formatName_(zone, name);
  }
  /**
   * Create a snapshot of a disk.
   *
   * @see [Snapshots Overview]{@link https://cloud.google.com/compute/docs/disks/persistent-disks#snapshots}
   * @see [Disks: createSnapshot API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/disks/createSnapshot}
   *
   * @param {string} name - Name of the snapshot.
   * @param {object=} options - See the
   *     [Disks: createSnapshot](https://cloud.google.com/compute/docs/reference/v1/disks/createSnapshot)
   *     request body.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Snapshot} callback.snapshot - The created Snapshot
   *     object.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   * const disk = zone.disk('disk1');
   *
   * function callback(err, snapshot, operation, apiResponse) {
   *   // `snapshot` is a Snapshot object.
   *
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * }
   *
   * disk.createSnapshot('new-snapshot-name', callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * disk.createSnapshot('new-snapshot-name').then(function(data) {
   *   const snapshot = data[0];
   *   const operation = data[1];
   *   const apiResponse = data[2];
   * });
   */
  createSnapshot(
    name: string,
    options: CreateSnapshotOptions,
    callback: CreateResourceCallback<Snapshot>
  ): void;
  createSnapshot(
    name: string,
    callback: CreateResourceCallback<Snapshot>
  ): void;
  createSnapshot(
    name: string,
    options?: CreateSnapshotOptions
  ): Promise<[Metadata]>;
  createSnapshot(
    name: string,
    options?: CreateSnapshotOptions | CreateResourceCallback<Snapshot>,
    callback?: CreateResourceCallback<Snapshot>
  ): void | Promise<[Metadata]> {
    const [opts, cb] = util.maybeOptionsOrCallback<
      CreateSnapshotOptions,
      CreateResourceCallback<Snapshot>
    >(options, callback);
    this.request(
      {
        method: 'POST',
        uri: '/createSnapshot',
        json: Object.assign({}, opts, {name}),
      },
      (err, resp) => {
        if (err) {
          cb(err, null, null, resp);
          return;
        }
        const snapshot = this.snapshot(name);
        const operation = this.zone.operation(resp.name);
        operation.metadata = resp;
        cb(null, snapshot, operation, resp);
      }
    );
  }
  /**
   * Delete the disk.
   *
   * @see [Disks: delete API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/disks/delete}
   *
   * @param {function=} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   * const disk = zone.disk('disk1');
   *
   * disk.delete(function(err, operation, apiResponse) {
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * disk.delete().then(function(data) {
   *   const operation = data[0];
   *   const apiResponse = data[1];
   * });
   */
  delete(callback: OperationCallback): void;
  delete(): Promise<[Metadata]>;
  delete(callback?: OperationCallback): void | Promise<[Metadata]> {
    callback = callback || util.noop;
    this.request({method: 'DELETE', uri: ''}, (err, resp) => {
      if (err) {
        callback!(err, null, resp);
        return;
      }
      const operation = this.zone.operation(resp.name);
      operation.metadata = resp;
      callback!(null, operation, resp);
    });
  }
  /**
   * Get a reference to a snapshot from this disk.
   *
   * @see [Snapshots Overview]{@link https://cloud.google.com/compute/docs/disks/persistent-disks#snapshots}
   *
   * @param {string} name - Name of the snapshot.
   * @returns {Snapshot}
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   * const disk = zone.disk('disk1');
   * const snapshot = disk.snapshot('snapshot-name');
   */
  snapshot(name: string): Snapshot {
    return new Snapshot(this, name);
  }
  /**
   * Format a disk's name how the API expects.
   *
   * @private
   *
   * @param {Zone} zone - The Zone this disk belongs to.
   * @param {string} name - The name of the disk.
   * @returns {string} - The formatted name.
   */
  static formatName_(zone: Zone, name: string): string {
    return `projects/${zone.compute.projectId}/zones/${zone.name}/disks/${name}`;
  }
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(Disk, {exclude: ['snapshot']});
