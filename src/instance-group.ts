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
import arrify = require('arrify');
import {ServiceObject, util} from '@google-cloud/common';
import type {Metadata} from '@google-cloud/common';
import {promisifyAll} from '@google-cloud/promisify';
import {paginator} from '@google-cloud/paginator';

import type {
  GetResourcesCallback,
  GetResourcesOptions,
  GetResourcesPromise,
  GetResourcesStream,
} from './interfaces';
import type {OperationCallback, OperationPromise} from './operation';
import type {VM} from './vm';
import type {Zone} from './zone';

export interface CreateInstanceGroupOptions {
  ports?: Record<string, number>;
  namedPorts?: {name: string; port: number}[];
}
export interface GetVMsOptions extends GetResourcesOptions {
  running?: boolean;
}

/**
 * You can create and manage groups of virtual machine instances so that you
 * don't have to individually control each instance in your project.
 *
 * @see [Creating Groups of Instances]{@link https://cloud.google.com/compute/docs/instance-groups}
 * @see [Unmanaged Instance Groups]{@link https://cloud.google.com/compute/docs/instance-groups/creating-groups-of-unmanaged-instances}
 *
 * @class
 * @param {Zone} zone
 * @param {string} name
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('us-central1-a');
 * const instanceGroup = zone.instanceGroup('web-servers');
 */
export class InstanceGroup extends ServiceObject {
  zone: Zone;
  name: string;
  /**
   * Get a list of {@link VM} instances in this instance group as a
   * readable object stream.
   *
   * @param {object=} options - Configuration object. See
   *     {@link InstanceGroup#getVMs} for a complete list of options.
   * @returns {stream}
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   * const instanceGroup = zone.instanceGroup('web-servers');
   *
   * instanceGroup.getVMsStream()
   *   .on('error', console.error)
   *   .on('data', function(vm) {
   *     // `vm` is a `VM` object.
   *   })
   *   .on('end', function() {
   *     // All instances retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * instanceGroup.getVMsStream()
   *   .on('data', function(vm) {
   *     this.end();
   *   });
   */
  getVMsStream: GetResourcesStream<VM>;
  constructor(zone: Zone, name: string) {
    const methods = {
      /**
       * Create an instance group.
       *
       * @method InstanceGroup#create
       * @param {object=} options - See {@link Zone#createInstanceGroup}.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const zone = compute.zone('us-central1-a');
       * const instanceGroup = zone.instanceGroup('web-servers');
       *
       * function onCreated(err, instanceGroup, operation, apiResponse) {
       *   // `instanceGroup` is an InstanceGroup object.
       *
       *   // `operation` is an Operation object that can be used to check the
       *   // status of the request.
       * }
       *
       * instanceGroup.create(onCreated);
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * instanceGroup.create().then(function(data) {
       *   const instanceGroup = data[0];
       *   const operation = data[1];
       *   const apiResponse = data[2];
       * });
       */
      create: true,
      /**
       * Check if the instance group exists.
       *
       * @method InstanceGroup#exists
       * @param {function} callback - The callback function.
       * @param {?error} callback.err - An error returned while making this
       *     request.
       * @param {boolean} callback.exists - Whether the instance group exists or
       *     not.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const zone = compute.zone('us-central1-a');
       * const instanceGroup = zone.instanceGroup('web-servers');
       *
       * instanceGroup.exists(function(err, exists) {});
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * instanceGroup.exists().then(function(data) {
       *   const exists = data[0];
       * });
       */
      exists: true,
      /**
       * Get an instance group if it exists.
       *
       * You may optionally use this to "get or create" an object by providing an
       * object with `autoCreate` set to `true`. Any extra configuration that is
       * normally required for the `create` method must be contained within this
       * object as well.
       *
       * @method InstanceGroup#get
       * @param {options=} options - Configuration object.
       * @param {boolean} options.autoCreate - Automatically create the object if
       *     it does not exist. Default: `false`
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const zone = compute.zone('us-central1-a');
       * const instanceGroup = zone.instanceGroup('web-servers');
       *
       * instanceGroup.get(function(err, instanceGroup, apiResponse) {
       *   // `instanceGroup` is an InstanceGroup object.
       * });
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * instanceGroup.get().then(function(data) {
       *   const instanceGroup = data[0];
       *   const apiResponse = data[1];
       * });
       */
      get: true,
      /**
       * Get the instance group's metadata.
       *
       * @see [InstanceGroups: get API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroups/get}
       * @see [InstanceGroups Resource]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroups}
       *
       * @method InstanceGroup#getMetadata
       * @param {function=} callback - The callback function.
       * @param {?error} callback.err - An error returned while making this
       *     request.
       * @param {object} callback.metadata - The instance group's metadata.
       * @param {object} callback.apiResponse - The full API response.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const zone = compute.zone('us-central1-a');
       * const instanceGroup = zone.instanceGroup('web-servers');
       *
       * instanceGroup.getMetadata(function(err, metadata, apiResponse) {});
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * instanceGroup.getMetadata().then(function(data) {
       *   const metadata = data[0];
       *   const apiResponse = data[1];
       * });
       */
      getMetadata: true,
    };
    super({
      parent: zone,
      baseUrl: '/instanceGroups',
      /**
       * @name InstanceGroup#id
       * @type {string}
       */
      id: name,
      createMethod: zone.createInstanceGroup.bind(zone),
      methods: methods,
      pollIntervalMs: zone.compute.pollIntervalMs,
    });
    /**
     * The parent {@link Zone} instance of this {@link InstanceGroup} instance.
     * @name InstanceGroup#zone
     * @type {Zone}
     */
    this.zone = zone;
    /**
     * @name InstanceGroup#name
     * @type {string}
     */
    this.name = name;
    this.getVMsStream = paginator.streamify('getVMs');
  }
  add(vms: VM | VM[]): OperationPromise;
  add(vms: VM | VM[], callback: OperationCallback): void;
  /**
   * Add one or more VMs to this instance group.
   *
   * @see [InstanceGroups: addInstances API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroups/addInstances}
   *
   * @param {VM|VM[]} vms - VM instances to add to
   *     this instance group.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   * const instanceGroup = zone.instanceGroup('web-servers');
   *
   * const vms = [
   *   gce.zone('us-central1-a').vm('http-server'),
   *   gce.zone('us-central1-a').vm('https-server')
   * ];
   *
   * instanceGroup.add(vms, function(err, operation, apiResponse) {
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * instanceGroup.add(vms).then(function(data) {
   *   const operation = data[0];
   *   const apiResponse = data[1];
   * });
   */
  add(vms: VM | VM[], callback?: OperationCallback): void | OperationPromise {
    this.request(
      {
        method: 'POST',
        uri: '/addInstances',
        json: {instances: arrify(vms).map(vm => ({instance: vm.url}))},
      },
      (err, resp) => {
        if (err) {
          callback!(err, null, resp);
          return;
        }
        const operation = this.zone.operation(resp.name);
        operation.metadata = resp;
        callback!(null, operation, resp);
      }
    );
  }
  delete(): Promise<[Metadata]>;
  delete(callback: OperationCallback): void;
  /**
   * Delete the instance group.
   *
   * @see [InstanceGroups: delete API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroups/delete}
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
   * const instanceGroup = zone.instanceGroup('web-servers');
   *
   * instanceGroup.delete(function(err, operation, apiResponse) {
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * instanceGroup.delete().then(function(data) {
   *   const operation = data[0];
   *   const apiResponse = data[1];
   * });
   */
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
  getVMs(options?: GetVMsOptions): GetResourcesPromise<VM>;
  getVMs(callback: GetResourcesCallback<VM>): void;
  getVMs(options: GetVMsOptions, callback: GetResourcesCallback<VM>): void;
  /**
   * Get a list of VM instances in this instance group.
   *
   * @see [InstanceGroups: listInstances API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroups/listInstances}
   *
   * @param {object=} options - Instance search options.
   * @param {boolean} options.autoPaginate - Have pagination handled
   *     automatically. Default: true.
   * @param {string} options.filter - Search filter in the format of
   *     `{name} {comparison} {filterString}`.
   *     - **`name`**: the name of the field to compare
   *     - **`comparison`**: the comparison operator, `eq` (equal) or `ne`
   *       (not equal)
   *     - **`filterString`**: the string to filter to. For string fields, this
   *       can be a regular expression.
   * @param {number} options.maxApiCalls - Maximum number of API calls to make.
   * @param {number} options.maxResults - Maximum number of VMs to return.
   * @param {string} options.pageToken - A previously-returned page token
   *     representing part of the larger set of results to view.
   * @param {boolean} options.running - Only return instances which are running.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {VM[]} callback.vms - VM objects from this instance
   *     group.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   * const instanceGroup = zone.instanceGroup('web-servers');
   *
   * instanceGroup.getVMs(function(err, vms) {
   *   // `vms` is an array of `VM` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, vms, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     instanceGroup.getVMs(nextQuery, callback);
   *   }
   * }
   *
   * instanceGroup.getVMs({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * instanceGroup.getVMs().then(function(data) {
   *   const vms = data[0];
   * });
   */
  getVMs(
    options?: GetVMsOptions | GetResourcesCallback<VM>,
    callback?: GetResourcesCallback<VM>
  ): void | GetResourcesPromise<VM> {
    const [opts, cb] = util.maybeOptionsOrCallback<
      GetVMsOptions,
      GetResourcesCallback<VM>
    >(options || {}, callback);
    let body;
    if (opts.running) {
      body = {instanceState: 'RUNNING'};
    }
    this.request(
      {method: 'POST', uri: '/listInstances', qs: opts, json: body},
      (err, resp) => {
        if (err) {
          cb(err, null, null, resp);
          return;
        }
        let nextQuery = null;
        if (resp.nextPageToken) {
          nextQuery = Object.assign({}, opts, {pageToken: resp.nextPageToken});
        }
        const vms = arrify(resp.items as Metadata[]).map(vm => {
          const vmInstance = this.zone.vm(vm.instance);
          vmInstance.metadata = vm;
          return vmInstance;
        });
        cb(null, vms, nextQuery, resp);
      }
    );
  }
  remove(vms: VM | VM[]): OperationPromise;
  remove(vms: VM | VM[], callback: OperationCallback): void;
  /**
   * Remove one or more VMs from this instance group.
   *
   * @see [InstanceGroups: removeInstances API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroups/removeInstances}
   *
   * @param {VM|VM[]} vms - VM instances to remove
   *     from this instance group.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   * const instanceGroup = zone.instanceGroup('web-servers');
   *
   * const vms = [
   *   gce.zone('us-central1-a').vm('http-server'),
   *   gce.zone('us-central1-a').vm('https-server')
   * ];
   *
   * instanceGroup.remove(vms, function(err, operation, apiResponse) {
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * instanceGroup.remove(vms).then(function(data) {
   *   const operation = data[0];
   *   const apiResponse = data[1];
   * });
   */
  remove(
    vms: VM | VM[],
    callback?: OperationCallback
  ): void | OperationPromise {
    this.request(
      {
        method: 'POST',
        uri: '/removeInstances',
        json: {instances: arrify(vms).map(vm => ({instance: vm.url}))},
      },
      (err, resp) => {
        if (err) {
          callback!(err, null, resp);
          return;
        }
        const operation = this.zone.operation(resp.name);
        operation.metadata = resp;
        callback!(err, operation, resp);
      }
    );
  }
  setPorts(ports: Record<string, number>): OperationPromise;
  setPorts(ports: Record<string, number>, callback: OperationCallback): void;
  /**
   * Set the named ports for this instance group.
   *
   * @see [InstanceGroups: setNamedPorts API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroups/setNamedPorts}
   *
   * @param {object} ports - A map of names to ports. The key should be the name,
   *     and the value the port number.
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
   * const instanceGroup = zone.instanceGroup('web-servers');
   *
   * const ports = {
   *   http: 80,
   *   https: 443
   * };
   *
   * instanceGroup.setPorts(ports, function(err, operation, apiResponse) {
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * instanceGroup.setPorts(ports).then(function(data) {
   *   const operation = data[0];
   *   const apiResponse = data[1];
   * });
   */
  setPorts(
    ports: Record<string, number>,
    callback?: OperationCallback
  ): void | OperationPromise {
    callback = callback || util.noop;
    this.request(
      {
        method: 'POST',
        uri: '/setNamedPorts',
        json: {namedPorts: InstanceGroup.formatPorts_(ports)},
      },
      (err, resp) => {
        if (err) {
          callback!(err, null, resp);
          return;
        }
        const operation = this.zone.operation(resp.name);
        operation.metadata = resp;
        callback!(null, operation, resp);
      }
    );
  }
  /**
   * Format a map of named ports in the way the API expects.
   *
   * @private
   *
   * @param {object} ports - A map of names to ports. The key should be the name,
   *     and the value the port number.
   * @returns {object[]} - The formatted array of named ports.
   */
  static formatPorts_(
    ports: Record<string, number>
  ): {name: string; port: number}[] {
    return Object.keys(ports).map(port => {
      return {
        name: port,
        port: ports[port],
      };
    });
  }
}

/*! Developer Documentation
 *
 * These methods can be auto-paginated.
 */
paginator.extend(InstanceGroup, ['getVMs']);

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(InstanceGroup);
