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

'use strict';

var arrify = require('arrify');
var common = require('@google-cloud/common');
var extend = require('extend');
var is = require('is');
var util = require('util');

/**
 * @class
 * @param {Zone} zone
 * @param {string} name
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('us-central1-a');
 * const instanceGroupManager = zone.instanceGroupManager('web-servers');
 */
function InstanceGroupManager(zone, name) {
  var methods = {
    /**
     * Create an instance group manager.
     *
     * @method InstanceGroupManager#create
     * @param {InstanceTemplate} instanceTemplate - Instance template to use for this instance group manager.
     * @param {object=} options - See {@link Zone#createInstanceGroupManager}.
     *
     * @example
     * const Compute = require('@google-cloud/compute');
     * const compute = new Compute();
     * const instanceTemplate = compute.instanceTemplate('my-instance-template');
     * const zone = compute.zone('us-central1-a');
     * const instanceGroupManager = zone.instanceGroupManager('web-servers', instanceTemplate);
     *
     * function onCreated(err, instanceGroupManager, operation, apiResponse) {
     *   // `instanceGroupManager` is an InstanceGroupManager object.
     *
     *   // `operation` is an Operation object that can be used to check the
     *   // status of the request.
     * }
     *
     * instanceGroupManager.create(instanceTemplate, onCreated);
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * instanceGroupManager.create(instanceTemplate).then(function(data) {
     *   const instanceGroupManager = data[0];
     *   const operation = data[1];
     *   const apiResponse = data[2];
     * });
     */
    create: true,

    /**
     * Check if the instance group manager exists.
     *
     * @method InstanceGroupManager#exists
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
     * const instanceGroupManager = zone.instanceGroupManager('web-servers');
     *
     * instanceGroupManager.exists(function(err, exists) {});
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * instanceGroupManager.exists().then(function(data) {
     *   const exists = data[0];
     * });
     */
    exists: true,

    /**
     * Get an instance group manager if it exists.
     *
     * @method InstanceGroupManager#get
     * @param {options=} options - Configuration object.
     *
     * @example
     * const Compute = require('@google-cloud/compute');
     * const compute = new Compute();
     * const zone = compute.zone('us-central1-a');
     * const instanceGroupManager = zone.instanceGroupManager('web-servers');
     *
     * instanceGroupManager.get(function(err, instanceGroupManager, apiResponse) {
     *   // `instanceGroupManager` is an InstanceGroupManager object.
     * });
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * instanceGroupManager.get().then(function(data) {
     *   const instanceGroupManager = data[0];
     *   const apiResponse = data[1];
     * });
     */
    get: true,

    /**
     * Get the instance group's metadata.
     *
     * @see [InstanceGroupManagers: get API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroupManagers/get}
     * @see [InstanceGroupManagers Resource]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroupManagers}
     *
     * @method InstanceGroupManager#getMetadata
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
     * const instanceGroupManager = zone.instanceGroupManager('web-servers');
     *
     * instanceGroupManager.getMetadata(function(err, metadata, apiResponse) {});
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * instanceGroupManager.getMetadata().then(function(data) {
     *   const metadata = data[0];
     *   const apiResponse = data[1];
     * });
     */
    getMetadata: true,
  };

  common.ServiceObject.call(this, {
    parent: zone,
    baseUrl: '/instanceGroupManagers',
    /**
     * @name InstanceGroupManager#id
     * @type {string}
     */
    id: name,
    createMethod: zone.createInstanceGroupManager.bind(zone),
    methods: methods,
  });

  /**
   * The parent {@link Zone} instance of this {@link InstanceGroupManager} instance.
   * @name InstanceGroupManager#zone
   * @type {Zone}
   */
  this.zone = zone;

  /**
   * @name InstanceGroupManager#name
   * @type {string}
   */
  this.name = name;
}

util.inherits(InstanceGroupManager, common.ServiceObject);

/**
 * Delete the instance group manager.
 *
 * @see [InstanceGroupManagers: delete API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroupManagers/delete}
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
 * const instanceGroupManager = zone.instanceGroupManager('web-servers');
 *
 * instanceGroupManager.delete(function(err, operation, apiResponse) {
 *   // `operation` is an Operation object that can be used to check the status
 *   // of the request.
 * });
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * instanceGroupManager.delete().then(function(data) {
 *   const operation = data[0];
 *   const apiResponse = data[1];
 * });
 */
InstanceGroupManager.prototype.delete = function(callback) {
  var self = this;

  callback = callback || common.util.noop;

  common.ServiceObject.prototype.delete.call(this, function(err, resp) {
    if (err) {
      callback(err, null, resp);
      return;
    }

    var operation = self.zone.operation(resp.name);
    operation.metadata = resp;

    callback(null, operation, resp);
  });
};

/**
 * Get a list of managed VM instances in this instance group manager.
 *
 * @see [InstaceGroups: listInstances API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroupManagers/listInstances}
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
 * const instanceGroupManager = zone.instanceGroupManager('web-servers');
 *
 * instanceGroupManager.getVMs(function(err, vms) {
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
 *     instanceGroupManager.getVMs(nextQuery, callback);
 *   }
 * }
 *
 * instanceGroupManager.getVMs({
 *   autoPaginate: false
 * }, callback);
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * instanceGroupManager.getVMs().then(function(data) {
 *   const vms = data[0];
 * });
 */
InstanceGroupManager.prototype.getVMs = function(options, callback) {
  var self = this;

  if (is.fn(options)) {
    callback = options;
    options = {};
  }

  options = options || {};

  var body;

  if (options.running) {
    body = {
      instanceState: 'RUNNING',
    };
  }

  this.request(
    {
      method: 'POST',
      uri: '/listManagedInstances',
      qs: options,
      json: body,
    },
    function(err, resp) {
      if (err) {
        callback(err, null, null, resp);
        return;
      }

      var nextQuery = null;

      if (resp.nextPageToken) {
        nextQuery = extend({}, options, {
          pageToken: resp.nextPageToken,
        });
      }

      var vms = arrify(resp.items).map(function(vm) {
        var vmInstance = self.zone.vm(vm.instance);
        vmInstance.metadata = vm;
        return vmInstance;
      });

      callback(null, vms, nextQuery, resp);
    }
  );
};

/**
 * Get a list of managed {@link VM} instances in this instance group as a
 * readable object stream.
 *
 * @param {object=} options - Configuration object. See
 *     {@link InstanceGroupManager#getVMs} for a complete list of options.
 * @returns {stream}
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('us-central1-a');
 * const instanceGroupManager = zone.instanceGroupManager('web-servers');
 *
 * instanceGroupManager.getVMsStream()
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
 * instanceGroupManager.getVMsStream()
 *   .on('data', function(vm) {
 *     this.end();
 *   });
 */
InstanceGroupManager.prototype.getVMsStream = common.paginator.streamify(
  'getVMs'
);

/**
 * Remove the VMs managed by this instance group.
 *
 * @see [InstanceGroupManagers: abandonInstances API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroupManagers/abandonInstances}
 *
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
 * const instanceGroupManager = zone.instanceGroupManager('web-servers');
 *
 * instanceGroupManager.removeVMs(function(err, operation, apiResponse) {
 *   // `operation` is an Operation object that can be used to check the status
 *   // of the request.
 * });
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * instanceGroupManager.removeVMs().then(function(data) {
 *   const operation = data[0];
 *   const apiResponse = data[1];
 * });
 */
InstanceGroupManager.prototype.removeVMs = function(callback) {
  var self = this;

  this.request(
    {
      method: 'POST',
      uri: '/abandonInstances',
    },
    function(err, resp) {
      if (err) {
        callback(err, null, resp);
        return;
      }

      var operation = self.zone.operation(resp.name);
      operation.metadata = resp;

      callback(err, operation, resp);
    }
  );
};

/**
 * Recreate the VMs managed by this instance group.
 *
 * @see [InstanceGroupManagers: recreateInstances API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroupManagers/recreateInstances}
 *
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
 * const instanceGroupManager = zone.instanceGroupManager('web-servers');
 *
 * instanceGroupManager.recreateVMs(function(err, operation, apiResponse) {
 *   // `operation` is an Operation object that can be used to check the status
 *   // of the request.
 * });
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * instanceGroupManager.recreateVMs().then(function(data) {
 *   const operation = data[0];
 *   const apiResponse = data[1];
 * });
 */
InstanceGroupManager.prototype.recreateVMs = function(callback) {
  var self = this;

  this.request(
    {
      method: 'POST',
      uri: '/recreateInstances',
    },
    function(err, resp) {
      if (err) {
        callback(err, null, resp);
        return;
      }

      var operation = self.zone.operation(resp.name);
      operation.metadata = resp;

      callback(err, operation, resp);
    }
  );
};

/**
 * Changes the intended size for this managed instance group.
 *
 * @see [InstanceGroupManagerManagers: resize API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroupManagers/resize}
 *
 * @param {number}  - Number of instances that should exist in this
 *     instance group manager.
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
 * instanceGroup.resize(size, function(err, operation, apiResponse) {
 *   // `operation` is an Operation object that can be used to check the status
 *   // of the request.
 * });
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * instanceGroup.resize(size).then(function(data) {
 *   const operation = data[0];
 *   const apiResponse = data[1];
 * });
 */
InstanceGroupManager.prototype.resize = function(size, callback) {
  var self = this;

  callback = callback || common.util.noop;

  this.request(
    {
      method: 'POST',
      uri: '/resize?size=' + parseInt(size),
    },
    function(err, resp) {
      if (err) {
        callback(err, null, resp);
        return;
      }

      var operation = self.zone.operation(resp.name);
      operation.metadata = resp;

      callback(null, operation, resp);
    }
  );
};

/*! Developer Documentation
 *
 * These methods can be auto-paginated.
 */
common.paginator.extend(InstanceGroupManager, ['getVMs']);

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
common.util.promisifyAll(InstanceGroupManager);

module.exports = InstanceGroupManager;
