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
import type {
  ApiError,
  DecorateRequestOptions,
  Metadata,
} from '@google-cloud/common';
import * as extend from 'extend';
import * as is from 'is';
import {promisifyAll} from '@google-cloud/promisify';
import {replaceProjectIdToken} from '@google-cloud/projectify';

import type {Compute} from '.';
import type {BaseOptions, Labeled, NetworkTier} from './interfaces';
import {Disk} from './disk';
import type {CreateDiskOptions} from './disk';
import type {OperationCallback, OperationPromise} from './operation';
import type {Zone} from './zone';

export interface CreateVMOptions extends BaseOptions, Labeled {
  disks?: CreateDiskOptions[];
  http?: boolean;
  https?: boolean;
  networkInterfaces?: {
    network?: string;
    subnetwork?: string;
    networkIP?: string;
    accessConfigs?: {
      type?: 'ONE_TO_ONE_NAT';
      name?: string;
      natIP?: string;
      setPublicPtr?: boolean;
      publicPtrDomainName?: string;
      networkTier?: NetworkTier;
      aliasIpRanges?: {ipCidrRange?: string; subnetworkRangeName?: string}[];
    }[];
    fingerprint?: string;
  }[];
  machineType?: string;
  os?: string;
  tags?: string[] | {items?: string[]; fingerprint?: string};
  template?: string;
  canIpForward?: boolean;
  metadata?: {
    fingerprint?: string;
    items?: {
      key?: string;
      value?: string;
    }[];
  };
  serviceAccounts?: {
    email?: string;
    scopes?: string[];
  }[];
  scheduling?: {
    onHostMaintenance?: string;
    automaticRestart?: boolean;
    preemptible?: boolean;
    nodeAffinities?: {
      key?: string;
      operator?: 'IN' | 'NOT_IN';
      values?: string[];
    }[];
    minNodeCpus?: number;
  };
  minCpuPlatform?: string;
  guestAccelerators?: {
    acceleratorType?: string;
    acceleratorCount?: number;
  }[];
  deletionProtection?: boolean;
  resourcePolicies?: string[];
  reservationAffinity?: {
    consumeReservationType?:
      | 'ANY_RESERVATION'
      | 'SPECIFIC_RESERVATION'
      | 'NO_RESERVATION';
    key?: string;
    values?: string[];
  };
  hostname?: string;
  displayDevice?: {
    enableDisplay?: boolean;
  };
  shieldedInstanceConfig?: {
    enableSecureBoot?: boolean;
    enableVtpm?: boolean;
    enableIntegrityMonitoring?: boolean;
  };
  shieldedInstanceIntegrityPolicy?: {
    updateAutoLearnPolicy?: boolean;
  };
  confidentialInstanceConfig?: {
    enableConfidentialCompute?: boolean;
  };
  fingerprint?: string;
  privateIpv6GoogleAccess?: string;
}
export type GetFingerprintedItemsCallback<T> = (
  error: ApiError | null,
  items?: T | null,
  fingerprint?: string | null,
  apiResponse?: Metadata | null
) => void;
export type FingerprintedItemsPromise<T> = Promise<[T, string, Metadata]>;
export interface GetSerialPortOptions {
  start?: string | number;
}
export interface SerialPortOutput {
  contents: string;
  start: string;
  next: string;
  selfLink: string;
  kind: string;
}
export type GetSerialPortOutputCallback = (
  error: ApiError | null,
  output?: SerialPortOutput | null,
  apiResponse?: Metadata | null
) => void;
export interface ResizeOptions {
  start?: boolean;
}
export interface WaitForOptions {
  timeout?: number;
}
export type Callback = (
  error: ApiError | null,
  metadata?: Metadata | null
) => void;

/**
 * Custom error type for errors related to detaching a disk.
 *
 * @private
 *
 * @param {string} message - Custom error message.
 * @returns {Error}
 */
class DetachDiskError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DetachDiskError';
  }
}

/**
 * Custom error type for when `waitFor()` does not return a status in a timely
 * fashion.
 *
 * @private
 *
 * @param {string} message - Custom error message.
 * @returns {Error}
 */
class WaitForTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WaitForTimeoutError';
  }
}

/**
 * The statuses that a VM can be in.
 *
 * @private
 */
const VALID_STATUSES = [
  'PROVISIONING',
  'STAGING',
  'RUNNING',
  'STOPPING',
  'SUSPENDING',
  'SUSPENDED',
  'TERMINATED',
];

/**
 * Interval for polling during waitFor.
 *
 * @private
 */
const WAIT_FOR_POLLING_INTERVAL_MS = 2000;

/**
 * An Instance object allows you to interact with a Google Compute Engine
 * instance.
 *
 * @see [Instances and Networks]{@link https://cloud.google.com/compute/docs/instances-and-network}
 * @see [Instance Resource]{@link https://cloud.google.com/compute/docs/reference/v1/instances}
 *
 * @class
 * @param {Zone} zone - Zone object this instance belongs to.
 * @param {string} name - Name of the instance.
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('zone-name');
 * const vm = zone.vm('vm-name');
 */
export class VM extends ServiceObject {
  zone: Zone;
  name: string;
  hasActiveWaiters: boolean;
  waiters: {
    status: string;
    timeout: number;
    startTime: number;
    callback: Callback;
  }[];
  url: string;
  constructor(zone: Zone, name: string) {
    name = name.replace(/.*\/([^/]+)$/, '$1'); // Just the instance name.
    const methods = {
      /**
       * Create a virtual machine.
       *
       * @method VM#create
       * @param {object} config - See {@link Zone#createVM}.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const zone = compute.zone('zone-name');
       * const vm = zone.vm('vm-name');
       *
       * const config = {
       *   // ...
       * };
       *
       * vm.create(config, function(err, vm, operation, apiResponse) {
       *   // `vm` is a VM object.
       *
       *   // `operation` is an Operation object that can be used to check the
       *   // status of the request.
       * });
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * vm.create(config).then(function(data) {
       *   const vm = data[0];
       *   const operation = data[1];
       *   const apiResponse = data[2];
       * });
       */
      create: true,
      /**
       * Check if the vm exists.
       *
       * @method VM#exists
       * @param {function} callback - The callback function.
       * @param {?error} callback.err - An error returned while making this
       *     request.
       * @param {boolean} callback.exists - Whether the vm exists or not.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const zone = compute.zone('zone-name');
       * const vm = zone.vm('vm-name');
       *
       * vm.exists(function(err, exists) {});
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * vm.exists().then(function(data) {
       *   const exists = data[0];
       * });
       */
      exists: true,
      /**
       * Get a virtual machine if it exists.
       *
       * You may optionally use this to "get or create" an object by providing an
       * object with `autoCreate` set to `true`. Any extra configuration that is
       * normally required for the `create` method must be contained within this
       * object as well.
       *
       * @method VM#get
       * @param {options=} options - Configuration object.
       * @param {boolean} options.autoCreate - Automatically create the object if
       *     it does not exist. Default: `false`
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const zone = compute.zone('zone-name');
       * const vm = zone.vm('vm-name');
       *
       * vm.get(function(err, vm, apiResponse) {
       *   // `vm` is a VM object.
       * });
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * vm.get().then(function(data) {
       *   const vm = data[0];
       *   const apiResponse = data[1];
       * });
       */
      get: true,
      /**
       * Get the instance's metadata.
       *
       * @see [Instance Resource]{@link https://cloud.google.com/compute/docs/reference/v1/instances}
       * @see [Instance: get API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/get}
       *
       * @method VM#getMetadata
       * @param {function=} callback - The callback function.
       * @param {?error} callback.err - An error returned while making this
       *     request.
       * @param {object} callback.metadata - The instance's metadata.
       * @param {object} callback.apiResponse - The full API response.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const zone = compute.zone('zone-name');
       * const vm = zone.vm('vm-name');
       *
       * vm.getMetadata(function(err, metadata, apiResponse) {});
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * vm.getMetadata().then(function(data) {
       *   // Representation of this VM as the API sees it.
       *   const metadata = data[0];
       *   const apiResponse = data[1];
       *
       *   // Custom metadata and predefined keys.
       *   const customMetadata = metadata.metadata;
       * });
       */
      getMetadata: true,
    };
    super({
      parent: zone,
      baseUrl: '/instances',
      /**
       * @name VM#id
       * @type {string}
       */
      id: name,
      createMethod: zone.createVM.bind(zone),
      methods: methods,
      pollIntervalMs: zone.compute.pollIntervalMs,
    });

    /**
     * @name VM#name
     * @type {string}
     */
    this.name = name;
    /**
     * The parent {@link Zone} instance of this {@link VM} instance.
     * @name VM#zone
     * @type {Zone}
     */
    this.zone = zone;
    this.hasActiveWaiters = false;
    this.waiters = [];
    this.url = `https://www.googleapis.com/compute/v1/projects/${zone.compute.projectId}/zones/${zone.name}/instances/${name}`;
  }
  attachDisk(
    disk: Disk,
    options?: CreateDiskOptions & {readOnly?: boolean}
  ): OperationPromise;
  attachDisk(disk: Disk, callback: OperationCallback): void;
  attachDisk(
    disk: Disk,
    options: CreateDiskOptions & {readOnly?: boolean},
    callback: OperationCallback
  ): void;
  /**
   * Attach a disk to the instance.
   *
   * @see [Disks Overview]{@link https://cloud.google.com/compute/docs/disks}
   * @see [Disk Resource]{@link https://cloud.google.com/compute/docs/reference/v1/disks}
   * @see [Instance: attachDisk API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/attachDisk}
   *
   * @throws {Error} if a {@link Disk} is not provided.
   *
   * @param {Disk} disk - The disk to attach.
   * @param {object=} options - See the
   *     [Instances: attachDisk](https://cloud.google.com/compute/docs/reference/v1/instances/attachDisk)
   *     request body.
   * @param {boolean} options.readOnly - Attach the disk in read-only mode. (Alias
   *     for `options.mode = READ_ONLY`)
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('zone-name');
   * const vm = zone.vm('vm-name');
   *
   * const disk = zone.disk('my-disk');
   *
   * function callback(err, operation, apiResponse) {
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * }
   *
   * vm.attachDisk(disk, callback);
   *
   * //-
   * // Provide an options object to customize the request.
   * //-
   * const options = {
   *   autoDelete: true,
   *   readOnly: true
   * };
   *
   * vm.attachDisk(disk, options, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * vm.attachDisk(disk, options).then(function(data) {
   *   const operation = data[0];
   *   const apiResponse = data[1];
   * });
   */
  attachDisk(
    disk: Disk,
    options?: (CreateDiskOptions & {readOnly?: boolean}) | OperationCallback,
    callback?: OperationCallback
  ): void | OperationPromise {
    if (!(disk instanceof Disk)) {
      throw new Error('A Disk object must be provided.');
    }
    if (is.fn(options)) {
      callback = options as OperationCallback;
      options = {};
    }
    const body = Object.assign(
      // Default the deviceName to the name of the disk, like the Console does.
      {deviceName: disk.name},
      options as CreateDiskOptions & {readOnly?: boolean},
      {source: disk.formattedName}
    );
    if (body.readOnly) {
      body.mode = 'READ_ONLY';
      delete body.readOnly;
    }
    this.request({method: 'POST', uri: '/attachDisk', json: body}, callback!);
  }
  delete(): Promise<[Metadata]>;
  delete(callback: OperationCallback): void;
  /**
   * Delete the instance.
   *
   * @see [Instance: delete API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/delete}
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
   * const zone = compute.zone('zone-name');
   * const vm = zone.vm('vm-name');
   *
   * vm.delete(function(err, operation, apiResponse) {
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * vm.delete().then(function(data) {
   *   const operation = data[0];
   *   const apiResponse = data[1];
   * });
   */
  delete(callback?: OperationCallback): void | Promise<[Metadata]> {
    this.request({method: 'DELETE', uri: ''}, callback || util.noop);
  }
  detachDisk(disk: Disk): OperationPromise;
  detachDisk(disk: Disk, callback: OperationCallback): void;
  /**
   * Detach a disk from the instance.
   *
   * @see [Instance: detachDisk API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/detachDisk}
   *
   * @param {Disk} disk - The device name of the disk
   *     to detach. If a Disk object is provided, we try to find the device name
   *     automatically by searching through the attached disks on the instance.
   * @param {function=} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('zone-name');
   * const vm = zone.vm('vm-name');
   *
   * const disk = zone.disk('my-disk');
   *
   * vm.detachDisk(disk, function(err, operation, apiResponse) {
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * vm.detachDisk(disk).then(function(data) {
   *   const operation = data[0];
   *   const apiResponse = data[1];
   * });
   */
  detachDisk(
    disk: Disk,
    callback?: OperationCallback
  ): void | OperationPromise {
    if (!(disk instanceof Disk)) {
      throw new Error('A Disk object must be provided.');
    }
    this.getMetadata((err: ApiError | null, metadata: Metadata | null) => {
      if (err) {
        callback!(new DetachDiskError(err.message), null, null);
        return;
      }
      this.zone.compute.authClient.getProjectId((err, projectId) => {
        if (err) {
          callback!(err, null, null);
          return;
        }
        const diskName = replaceProjectIdToken(disk.formattedName, projectId!);
        let deviceName;
        const resourceBaseUrl = 'https://www.googleapis.com/compute/v1/';
        const disks = metadata.disks || [];
        // Try to find the deviceName by matching the source of the attached disks
        // to the name of the disk provided by the user.
        for (let i = 0; !deviceName && i < disks.length; i++) {
          const attachedDisk = disks[i];
          const source = attachedDisk.source.replace(resourceBaseUrl, '');
          if (source === diskName) {
            deviceName = attachedDisk.deviceName;
          }
        }
        if (!deviceName) {
          callback!(
            new DetachDiskError('Device name for this disk was not found.'),
            null,
            null
          );
          return;
        }
        this.request(
          {method: 'POST', uri: '/detachDisk', qs: {deviceName: deviceName}},
          callback || util.noop
        );
      });
    });
  }
  getLabels(): FingerprintedItemsPromise<Record<string, string>>;
  getLabels(
    callback: GetFingerprintedItemsCallback<Record<string, string>>
  ): void;
  /**
   * Get the instance's labels and their fingerprint.
   *
   * This method wraps {@link VM#getMetadata}, returning only the `labels`
   * property.
   *
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {object[]} callback.labels - Label objects from this VM.
   * @param {string} callback.fingerprint - The current label fingerprint.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('zone-name');
   * const vm = zone.vm('vm-name');
   *
   * vm.getLabels(function(err, labels, fingerprint, apiResponse) {});
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * vm.getLabels().then(function(data) {
   *   const labels = data[0];
   *   const fingerprint = data[1];
   *   const apiResponse = data[2];
   * });
   */
  getLabels(
    callback?: GetFingerprintedItemsCallback<Record<string, string>>
  ): void | FingerprintedItemsPromise<Record<string, string>> {
    this.getMetadata(
      (
        err: ApiError | null,
        metadata?: Metadata | null,
        apiResponse?: Metadata | null
      ) => {
        if (err) {
          callback!(err, null, null, apiResponse);
          return;
        }
        callback!(
          null,
          metadata.labels,
          metadata.labelFingerprint,
          apiResponse
        );
      }
    );
  }
  getSerialPortOutput(
    options?: GetSerialPortOptions
  ): Promise<[SerialPortOutput, Metadata]>;
  getSerialPortOutput(
    port: number,
    options?: GetSerialPortOptions
  ): Promise<[SerialPortOutput, Metadata]>;
  getSerialPortOutput(callback: GetSerialPortOutputCallback): void;
  getSerialPortOutput(
    port: number | GetSerialPortOptions,
    callback: GetSerialPortOutputCallback
  ): void;
  getSerialPortOutput(
    port: number,
    options: GetSerialPortOptions,
    callback: GetSerialPortOutputCallback
  ): void;
  /**
   * Returns the serial port output for the instance.
   *
   * @see [Instances: getSerialPortOutput API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/getSerialPortOutput}
   *
   * @param {number=} port - The port from which the output is retrieved (1-4).
   *    Default: `1`.
   * @param {object=} options - Configuration object.
   * @param {string=} options.start - The starting byte position of the output to return.
   *    To start with the first byte of output to the specified port, omit this field or set it to 0.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {object} callback.output - The output from the port.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('zone-name');
   * const vm = zone.vm('vm-name');
   *
   * vm.getSerialPortOutput(function(err, output, apiResponse) {});
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * vm.getSerialPortOutput().then(function(data) {
   *   const output = data[0];
   *   const apiResponse = data[1];
   * });
   */
  getSerialPortOutput(
    port?: number | GetSerialPortOptions | GetSerialPortOutputCallback,
    options?: GetSerialPortOptions | GetSerialPortOutputCallback,
    callback?: GetSerialPortOutputCallback
  ): void | Promise<[SerialPortOutput, Metadata]> {
    if (is.object(port)) {
      options = port as GetSerialPortOptions;
      port = 1;
    } else if (is.fn(port)) {
      callback = port as GetSerialPortOutputCallback;
      port = 1;
    }
    port = port || 1;
    const [opts, cb] = util.maybeOptionsOrCallback<
      GetSerialPortOptions,
      GetSerialPortOutputCallback
    >(options || {}, callback);
    const reqOpts = {
      uri: '/serialPort',
      qs: {port: port, start: opts.start || 0},
    };
    const request = ServiceObject.prototype.request;
    request.call(this, reqOpts, (err, resp) => {
      if (err) {
        cb(err, null, resp);
        return;
      }
      cb(null, resp.contents, resp);
    });
  }
  getTags(): FingerprintedItemsPromise<string[]>;
  getTags(callback: GetFingerprintedItemsCallback<string[]>): void;
  /**
   * Get the instance's tags and their fingerprint.
   *
   * This method wraps {@link VM#getMetadata}, returning only the `tags`
   * property.
   *
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {object[]} callback.tags - Tag objects from this VM.
   * @param {string} callback.fingerprint - The current tag fingerprint.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('zone-name');
   * const vm = zone.vm('vm-name');
   *
   * vm.getTags(function(err, tags, fingerprint, apiResponse) {});
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * vm.getTags().then(function(data) {
   *   const tags = data[0];
   *   const fingerprint = data[1];
   *   const apiResponse = data[2];
   * });
   */
  getTags(
    callback?: GetFingerprintedItemsCallback<string[]>
  ): void | FingerprintedItemsPromise<string[]> {
    this.getMetadata(
      (
        err: ApiError | null,
        metadata?: Metadata | null,
        apiResponse?: Metadata | null
      ) => {
        if (err) {
          callback!(err, null, null, apiResponse);
          return;
        }
        callback!(
          null,
          metadata.tags.items,
          metadata.tags.fingerprint,
          apiResponse
        );
      }
    );
  }
  reset(): OperationPromise;
  reset(callback: OperationCallback): void;
  /**
   * Reset the instance.
   *
   * @see [Instances: reset API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/reset}
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
   * const zone = compute.zone('zone-name');
   * const vm = zone.vm('vm-name');
   *
   * vm.reset(function(err, operation, apiResponse) {
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * vm.reset().then(function(data) {
   *   const operation = data[0];
   *   const apiResponse = data[1];
   * });
   */
  reset(callback?: OperationCallback): void | OperationPromise {
    this.request({method: 'POST', uri: '/reset'}, callback || util.noop);
  }
  resize(machineType: string, options?: ResizeOptions): Promise<[Metadata]>;
  resize(machineType: string, callback: OperationCallback): void;
  resize(
    machineType: string,
    options: ResizeOptions,
    callback: OperationCallback
  ): void;
  /**
   * Set the machine type for this instance, **stopping and restarting the VM as
   * necessary**.
   *
   * For a list of the standard, high-memory, and high-CPU machines you may choose
   * from, see
   * [Predefined machine types]{@link https://cloud.google.com/compute/docs/machine-types#predefined_machine_types}.
   *
   * In order to change the machine type, the VM must not be running. This method
   * will automatically stop the VM if it is running before changing the machine
   * type. After it is sucessfully changed, the VM will be started.
   *
   * @see [Instances: setMachineType API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/setMachineType}
   * @see [Predefined machine types]{@link https://cloud.google.com/compute/docs/machine-types#predefined_machine_types}
   *
   * @param {string} machineType - Full or partial machine type. See a list of
   *     predefined machine types
   *     [here](https://cloud.google.com/compute/docs/machine-types#predefined_machine_types).
   * @param {object=} options - Configuration object.
   * @param {boolean} options.start - Start the VM after successfully updating the
   *     machine type. Default: `false`.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('zone-name');
   * const vm = zone.vm('vm-name');
   *
   * vm.resize('n1-standard-1', function(err, apiResponse) {
   *   if (!err) {
   *     // The VM is running and its machine type was changed successfully.
   *   }
   * });
   *
   * //-
   * // By default, calling `resize` will start your server after updating its
   * // machine type. If you want to leave it stopped, set `options.start` to
   * // `false`.
   * //-
   * const options = {
   *   start: false
   * };
   *
   * vm.resize('ns-standard-1', options, function(err, apiResponse) {
   *   if (!err) {
   *     // The VM is stopped and its machine type was changed successfully.
   *   }
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * vm.resize('ns-standard-1', options).then(function(data) {
   *   const apiResponse = data[0];
   * });
   */
  resize(
    machineType: string,
    options?: ResizeOptions | OperationCallback,
    callback?: OperationCallback
  ): void | Promise<[Metadata]> {
    const compute = this.zone.parent as Compute;
    const [opts, cb] = util.maybeOptionsOrCallback<
      ResizeOptions,
      OperationCallback
    >(options || {}, callback);
    const isPartialMachineType = machineType.indexOf('/') === -1;
    if (isPartialMachineType) {
      machineType = `zones/${this.zone.name}/machineTypes/${machineType}`;
    }
    this.request(
      {
        method: 'POST',
        uri: '/setMachineType',
        json: {machineType: machineType},
      },
      compute.execAfterOperation_(
        (err: ApiError | null, apiResponse?: Metadata | null) => {
          if (err) {
            if (err.message === 'Instance is starting or running.') {
              // The instance must be stopped before its machine type can be set.
              this.stop(
                compute.execAfterOperation_(
                  (err: ApiError | null, apiResponse?: Metadata | null) => {
                    if (err) {
                      cb(err, apiResponse);
                      return;
                    }
                    // Try again now that the instance is stopped.
                    this.resize(machineType, cb);
                  }
                )
              );
            } else {
              cb(err, apiResponse);
            }
            return;
          }
          // The machine type was changed successfully.
          if (opts.start === false) {
            cb(null, apiResponse);
          } else {
            this.start(compute.execAfterOperation_(cb));
          }
        }
      )
    );
  }
  setLabels(
    labels: Record<string, string | null>,
    labelFingerprint: string
  ): OperationPromise;
  setLabels(
    labels: Record<string, string | null>,
    labelFingerprint: string,
    callback: OperationCallback
  ): void;
  /**
   * Set labels for this instance.
   *
   * @see [Instances: setLabels API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/setLabels}
   *
   * @param {object} labels - New labels.
   * @param {string} labelFingerprint - The current labels fingerprint. An up-to-date
   *     fingerprint must be provided.
   * @param {function=} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('zone-name');
   * const vm = zone.vm('vm-name');
   *
   * const labels = {
   *   'startup-script': '...',
   *   customKey: null // Setting `null` will remove the `customKey` property.
   * };
   *
   * vm.setLabels(labels, function(err, operation, apiResponse) {
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * vm.setLabels(labels).then(function(data) {
   *   const operation = data[0];
   *   const apiResponse = data[1];
   * });
   */
  setLabels(
    labels: Record<string, string | null>,
    labelFingerprint: string,
    callback?: OperationCallback
  ): void | OperationPromise {
    const body = {labels: labels, labelFingerprint: labelFingerprint};
    this.request(
      {method: 'POST', uri: '/setLabels', json: body},
      callback || util.noop
    );
  }
  setMetadata(metadata?: Metadata): Promise<[Metadata]>;
  setMetadata(
    metadata: Metadata | undefined,
    callback: OperationCallback
  ): void;
  /**
   * Set the custom metadata for this instance.
   *
   * This will combine the `metadata` key/value pairs with any pre-existing
   * metadata. Any changes will override pre-existing keys. To remove a
   * pre-existing key, explicitly set the key's value to `null`.
   *
   * @see [Instances: setMetadata API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/setMetadata}
   *
   * @param {object} metadata - New metadata.
   * @param {function=} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('zone-name');
   * const vm = zone.vm('vm-name');
   *
   * const metadata = {
   *   'startup-script': '...',
   *   customKey: null // Setting `null` will remove the `customKey` property.
   * };
   *
   * vm.setMetadata(metadata, function(err, operation, apiResponse) {
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * vm.setMetadata(metadata).then(function(data) {
   *   const operation = data[0];
   *   const apiResponse = data[1];
   * });
   */
  setMetadata(
    metadata?: Metadata,
    callback?: OperationCallback
  ): void | Promise<[Metadata]> {
    callback = callback || util.noop;
    this.getMetadata(
      (
        err: ApiError | null,
        currentMetadata?: Metadata | null,
        apiResponse?: Metadata | null
      ) => {
        if (err) {
          callback?.(err, null, apiResponse);
          return;
        }
        const request = {
          fingerprint: currentMetadata.metadata.fingerprint,
          items: [] as {key: string; value: string | null}[],
        };
        const metadataJSON = (currentMetadata.metadata.items || []).reduce(
          (
            metadataJSON: Metadata,
            keyValPair: {key: string; value: string | null}
          ) => {
            metadataJSON[keyValPair.key] = keyValPair.value;
            return metadataJSON;
          },
          {}
        );
        const newMetadataJSON = Object.assign(metadataJSON, metadata);
        for (const key in newMetadataJSON) {
          /* eslint-disable no-prototype-builtins */
          if (newMetadataJSON.hasOwnProperty(key)) {
            const value = newMetadataJSON[key];
            if (value !== null) {
              request.items.push({key, value});
            }
          }
        }
        this.request(
          {method: 'POST', uri: '/setMetadata', json: request},
          callback!
        );
      }
    );
  }
  setTags(tags: string[], fingerprint: string): OperationPromise;
  setTags(
    tags: string[],
    fingerprint: string,
    callback: OperationCallback
  ): void;
  /**
   * Set the instance's tags.
   *
   * @see [Instances: setTags API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/setTags}
   *
   * @param {string[]} tags - The new tags for the instance.
   * @param {string} fingerprint - The current tags fingerprint. An up-to-date
   *     fingerprint must be provided.
   * @param {function=} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('zone-name');
   * const vm = zone.vm('vm-name');
   *
   * vm.getTags(function(err, tags, fingerprint) {
   *   tags.push('new-tag');
   *
   *  vm.setTags(tags, fingerprint, function(err, operation, apiResponse) {
   *     // `operation` is an Operation object that can be used to check the
   *     //  status of the request.
   *   });
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * vm.getTags().then(function(data) {
   *   const tags = data[0];
   *   const fingerprint = data[1];
   *
   *   tags.push('new-tag');
   *
   *   return vm.setTags(tags, fingerprint);
   * }).then(function(data) {
   *   const operation = data[0];
   *   const apiResponse = data[1];
   * });
   */
  setTags(
    tags: string[],
    fingerprint: string,
    callback?: OperationCallback
  ): void | OperationPromise {
    const body = {items: tags, fingerprint: fingerprint};
    this.request(
      {method: 'POST', uri: '/setTags', json: body},
      callback || util.noop
    );
  }
  start(): OperationPromise;
  start(callback: OperationCallback): void;
  /**
   * Start the instance.
   *
   * @see [Instances: start API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/start}
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
   * const zone = compute.zone('zone-name');
   * const vm = zone.vm('vm-name');
   *
   * vm.start(function(err, operation, apiResponse) {
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * vm.start().then(function(data) {
   *   const operation = data[0];
   *   const apiResponse = data[1];
   * });
   */
  start(callback?: OperationCallback): void | OperationPromise {
    this.request({method: 'POST', uri: '/start'}, callback || util.noop);
  }
  stop(): OperationPromise;
  stop(callback: OperationCallback): void;
  /**
   * Stop the instance.
   *
   * @see [Instances: stop API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/stop}
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
   * const zone = compute.zone('zone-name');
   * const vm = zone.vm('vm-name');
   *
   * vm.stop(function(err, operation, apiResponse) {
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * vm.stop().then(function(data) {
   *   const operation = data[0];
   *   const apiResponse = data[1];
   * });
   */
  stop(callback?: OperationCallback): void | OperationPromise {
    this.request({method: 'POST', uri: '/stop'}, callback || util.noop);
  }
  update(metadata?: Metadata): OperationPromise;
  update(metadata: Metadata | undefined, callback: OperationCallback): void;
  /**
   * Update the instance.
   *
   * NOTE: This method will pull the latest record of the current metadata, then
   * merge it with the object you provide. This means there is a chance of a
   * mismatch in data if the resource is updated immediately after we pull the
   * metadata, but before we update it.
   *
   * @see [Instances: update API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/update}
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
   * const zone = compute.zone('zone-name');
   * const vm = zone.vm('vm-name');
   *
   * const metadata = {
   *   deletionProtection: false,
   * };
   *
   * vm.update(metadata, function(err, operation, apiResponse) {
   *   // `operation` is an Operation object that can be used to check the
   *   // status of the request.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * vm.update(metadata).then(function(data) {
   *   const operation = data[0];
   *   const apiResponse = data[1];
   * });
   */
  update(
    metadata?: Metadata,
    callback?: OperationCallback
  ): void | OperationPromise {
    callback = callback || util.noop;

    this.getMetadata(
      (err: ApiError | null, currentMetadata?: Metadata | null) => {
        if (err) {
          callback!(err, null, null);
          return;
        }

        this.request(
          {
            method: 'PUT',
            uri: '',
            json: extend(true, currentMetadata, metadata),
          },
          callback!
        );
      }
    );
  }
  waitFor(status: string, options?: WaitForOptions): Promise<[Metadata]>;
  waitFor(status: string, callback: Callback): void;
  waitFor(status: string, options: WaitForOptions, callback: Callback): void;
  /**
   * This function will callback when the VM is in the specified state.
   *
   * Will time out after the specified time (default: 300 seconds).
   *
   * @param {string} status - The status to wait for. This can be:
   *     - "PROVISIONING"
   *     - "STAGING"
   *     - "RUNNING"
   *     - "STOPPING"
   *     - "SUSPENDING"
   *     - "SUSPENDED"
   *     - "TERMINATED"
   * @param {object=} options - Configuration object.
   * @param {number} options.timeout - The number of seconds to wait until timing
   *     out, between `0` and `600`. Default: `300`
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while waiting for the
   *     status.
   * @param {object} callback.metadata - The instance's metadata.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('zone-name');
   * const vm = zone.vm('vm-name');
   *
   * vm.waitFor('RUNNING', function(err, metadata) {
   *   if (!err) {
   *     // The VM is running.
   *   }
   * });
   *
   * //-
   * // By default, `waitFor` will timeout after 300 seconds while waiting for the
   * // desired state to occur. This can be changed to any number between 0 and
   * // 600. If the timeout is set to 0, it will poll once for status and then
   * // timeout if the desired state is not reached.
   * //-
   * const options = {
   *   timeout: 600
   * };
   *
   * vm.waitFor('TERMINATED', options, function(err, metadata) {
   *   if (!err) {
   *     // The VM is terminated.
   *   }
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * vm.waitFor('RUNNING', options).then(function(data) {
   *   const metadata = data[0];
   * });
   */
  waitFor(
    status: string,
    options?: WaitForOptions | Callback,
    callback?: Callback
  ): void | Promise<[Metadata]> {
    const [opts, cb] = util.maybeOptionsOrCallback<WaitForOptions, Callback>(
      options || {},
      callback
    );
    status = status.toUpperCase();
    // The timeout should default to five minutes, be less than or equal to 10
    // minutes, and be greater than or equal to 0 seconds.
    let timeout = 300;
    if (is.number(opts.timeout)) {
      timeout = Math.min(Math.max(opts.timeout!, 0), 600);
    }
    if (VALID_STATUSES.indexOf(status) === -1) {
      throw new Error('Status passed to waitFor is invalid.');
    }
    this.waiters.push({
      status: status,
      timeout: timeout,
      startTime: Date.now() / 1000,
      callback: cb,
    });
    if (!this.hasActiveWaiters) {
      this.hasActiveWaiters = true;
      this.startPolling_();
    }
  }
  /**
   * Poll `getMetadata` to check the VM's status. This runs a loop to ping
   * the API on an interval.
   *
   * Note: This method is automatically called when a `waitFor()` call
   * is made.
   *
   * @private
   */
  startPolling_(): void {
    if (!this.hasActiveWaiters) {
      return;
    }
    this.getMetadata((err: ApiError | null, metadata?: Metadata | null) => {
      const now = Date.now() / 1000;
      const waitersToRemove = this.waiters.filter(waiter => {
        if (err) {
          waiter.callback(err);
          return true;
        }
        if (metadata.status === waiter.status) {
          waiter.callback(null, metadata);
          return true;
        }
        if (now - waiter.startTime >= waiter.timeout) {
          const waitForTimeoutError = new WaitForTimeoutError(
            [
              'waitFor timed out waiting for VM ' + this.name,
              'to be in status: ' + waiter.status,
            ].join(' ')
          );
          waiter.callback(waitForTimeoutError);
          return true;
        }
        return false;
      });
      waitersToRemove.forEach(waiter => {
        this.waiters.splice(this.waiters.indexOf(waiter), 1);
      });
      this.hasActiveWaiters = this.waiters.length > 0;
      if (this.hasActiveWaiters) {
        setTimeout(this.startPolling_.bind(this), WAIT_FOR_POLLING_INTERVAL_MS);
      }
    });
  }
  request(reqOpts: DecorateRequestOptions): OperationPromise;
  request(reqOpts: DecorateRequestOptions, callback: OperationCallback): void;
  /**
   * Make a new request object from the provided arguments and wrap the callback
   * to intercept non-successful responses.
   *
   * Most operations on a VM are long-running. This method handles building an
   * operation and returning it to the user's provided callback. In methods that
   * don't require an operation, we simply don't do anything with the `Operation`
   * object.
   *
   * @private
   *
   * @param {string} method - Action.
   * @param {string} path - Request path.
   * @param {*} query - Request query object.
   * @param {*} body - Request body contents.
   * @param {function} callback - The callback function.
   */
  request(
    reqOpts: DecorateRequestOptions,
    callback?: OperationCallback
  ): void | OperationPromise {
    const request = ServiceObject.prototype.request;
    request.call(this, reqOpts, (err, resp) => {
      if (err) {
        callback?.(err, null, resp);
        return;
      }
      const operation = this.zone.operation(resp.name);
      operation.metadata = resp;
      callback?.(null, operation, resp);
    });
  }
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(VM);
