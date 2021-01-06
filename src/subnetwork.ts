/*!
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
import {ServiceObject, util} from '@google-cloud/common';
import type {Metadata} from '@google-cloud/common';
import {promisifyAll} from '@google-cloud/promisify';

import type {BaseOptions} from './interfaces';
import type {Network} from './network';
import type {OperationCallback} from './operation';
import type {Region} from './region';

export interface CreateSubnetworkOptions extends BaseOptions {
  region?: string | Region;
  network?: string | Network;
  range?: string;
  ipCidrRange?: string;
  privateIpGoogleAccess?: boolean;
  secondaryIpRanges?: {rangeName?: string; ipCidrRange?: string}[];
  fingerprint?: string;
  enableFlowLogs?: boolean;
  privateIpv6GoogleAccess?: string;
  purpose?: 'PRIVATE_RFC_1918' | 'INTERNAL_HTTPS_LOAD_BALANCER';
  role?: 'ACTIVE' | 'BACKUP';
  logConfig?: {
    enable?: boolean;
    aggregationInterval?: string;
    flowSampling?: number;
    metadata?: string;
    metadataFields?: string[];
    filterExp?: string;
  };
}

/**
 * An Subnetwork object allows you to interact with a Google Compute Engine
 * subnetwork.
 *
 * @see [Subnetworks Overview]{@link https://cloud.google.com/compute/docs/subnetworks}
 * @see [Subnetwork Resource]{@link https://cloud.google.com/compute/docs/reference/v1/subnetworks}
 *
 * @class
 * @param {Region} region - Region this subnetwork belongs to.
 * @param {string} name - Name of the subnetwork.
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const region = compute.region('region-name');
 * const subnetwork = region.subnetwork('subnetwork1');
 */
export class Subnetwork extends ServiceObject {
  name: string;
  region: Region;
  constructor(region: Region, name: string) {
    const methods = {
      /**
       * Create a subnetwork.
       *
       * @method Subnetwork#create
       * @param {object} config - See {@link Region#createSubnetwork}.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const region = compute.region('region-name');
       * const subnetwork = region.subnetwork('subnetwork1');
       *
       * const config = {
       *   // ...
       * };
       *
       * function callback(err, subnetwork, operation, apiResponse) {
       *   // `subnetwork` is a Subnetwork object.
       *
       *   // `operation` is an Operation object that can be used to check the
       *   // status of the request.
       * }
       *
       * subnetwork.create(config, callback);
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * subnetwork.create(config).then(function(data) {
       *   const subnetwork = data[0];
       *   const operation = data[1];
       *   const apiResponse = data[2];
       * });
       */
      create: true,
      /**
       * Check if the subnetwork exists.
       *
       * @method Subnetwork#exists
       * @param {function} callback - The callback function.
       * @param {?error} callback.err - An error returned while making this
       *     request.
       * @param {boolean} callback.exists - Whether the subnetwork exists or not.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const region = compute.region('region-name');
       * const subnetwork = region.subnetwork('subnetwork1');
       *
       * subnetwork.exists(function(err, exists) {});
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * subnetwork.exists().then(function(data) {
       *   const exists = data[0];
       * });
       */
      exists: true,
      /**
       * Get a subnetwork if it exists.
       *
       * You may optionally use this to "get or create" an object by providing an
       * object with `autoCreate` set to `true`. Any extra configuration that is
       * normally required for the `create` method must be contained within this
       * object as well.
       *
       * @method Subnetwork#get
       * @param {options=} options - Configuration object.
       * @param {boolean} options.autoCreate - Automatically create the object if
       *     it does not exist. Default: `false`
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const region = compute.region('region-name');
       * const subnetwork = region.subnetwork('subnetwork1');
       *
       * subnetwork.get(function(err, subnetwork, apiResponse) {
       *   // `subnetwork` is a Subnetwork object.
       * });
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * subnetwork.get().then(function(data) {
       *   const subnetwork = data[0];
       *   const apiResponse = data[1];
       * });
       */
      get: true,
      /**
       * Get the metadata of this subnetwork.
       *
       * @see [Subnetwork Resource]{@link https://cloud.google.com/compute/docs/reference/v1/subnetworks}
       * @see [Subnetwork: get API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/subnetworks/get}
       *
       * @method Subnetwork#getMetadata
       * @param {function=} callback - The callback function.
       * @param {?error} callback.err - An error returned while making this
       *     request.
       * @param {object} callback.metadata - The subnetwork's metadata.
       * @param {object} callback.apiResponse - The full API response.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const region = compute.region('region-name');
       * const subnetwork = region.subnetwork('subnetwork1');
       *
       * subnetwork.getMetadata(function(err, metadata, apiResponse) {});
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * subnetwork.getMetadata().then(function(data) {
       *   const metadata = data[0];
       *   const apiResponse = data[1];
       * });
       */
      getMetadata: true,
    };
    super({
      parent: region,
      baseUrl: '/subnetworks',
      id: name,
      createMethod: region.createSubnetwork.bind(region),
      methods: methods,
      pollIntervalMs: region.compute.pollIntervalMs,
    });
    /**
     * @name Subnetwork#name
     * @type {string}
     */
    this.name = name;
    /**
     * The parent {@link Region} instance of this {@link Subnetwork} instance.
     * @name Subnetwork#region
     * @type {Region}
     */
    this.region = region;
  }
  /**
   * Delete the subnetwork.
   *
   * @see [Subnetworks: delete API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/subnetworks/delete}
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
   * const region = compute.region('region-name');
   * const subnetwork = region.subnetwork('subnetwork1');
   *
   * subnetwork.delete(function(err, operation, apiResponse) {
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * subnetwork.delete().then(function(data) {
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
      const operation = this.region.operation(resp.name);
      operation.metadata = resp;
      callback!(null, operation, resp);
    });
  }
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(Subnetwork);
