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

var common = require('@google-cloud/common');
var util = require('util');

/**
 * @class
 * @param {Compute} compute - Compute object this instance template belongs to.
 * @param {string} name
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const instanceTemplate = compute.instanceTemplate('my-instance-template');
 */
function InstanceTemplate(compute, name) {
  var methods = {
    /**
     * Create an instance template.
     *
     * @method InstanceTemplate#create
     * @param {object=} options - See an
     *     [InstanceTemplate resource](https://cloud.google.com/compute/docs/reference/v1/instanceTemplate#resource).
     *
     * @example
     * const Compute = require('@google-cloud/compute');
     * const compute = new Compute();
     * const instanceTemplate = compute.instanceTemplate('my-instance-template');
     *
     * function onCreated(err, instanceTemplate, operation, apiResponse) {
     *   // `instanceTemplate` is an InstanceTemplate object.
     *
     *   // `operation` is an Operation object that can be used to check the
     *   // status of the request.
     * }
     *
     * instanceTemplate.create(options, onCreated);
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * instanceTemplate.create(options).then(function(data) {
     *   const instanceTemplate = data[0];
     *   const operation = data[1];
     *   const apiResponse = data[2];
     * });
     */
    create: true,

    /**
     * Check if the instance template exists.
     *
     * @method InstanceTemplate#exists
     * @param {function} callback - The callback function.
     * @param {?error} callback.err - An error returned while making this
     *     request.
     * @param {boolean} callback.exists - Whether the instance group exists or
     *     not.
     *
     * @example
     * const Compute = require('@google-cloud/compute');
     * const compute = new Compute();
     * const instanceTemplate = compute.instanceTemplate('my-instance-template');
     *
     * instanceTemplate.exists(function(err, exists) {});
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * instanceTemplate.exists().then(function(data) {
     *   const exists = data[0];
     * });
     */
    exists: true,

    /**
     * Get an instance template if it exists.
     *
     * You may optionally use this to "get or create" an object by providing an
     * object with `autoCreate` set to `true`. Any extra configuration that is
     * normally required for the `create` method must be contained within this
     * object as well.
     *
     * @method InstanceTemplate#get
     * @param {options=} options - Configuration object.
     * @param {boolean} options.autoCreate - Automatically create the object if
     *     it does not exist. Default: `false`
     *
     * @example
     * const Compute = require('@google-cloud/compute');
     * const compute = new Compute();
     * const instanceTemplate = compute.instanceTemplate('my-instance-template');
     *
     * instanceTemplate.get(function(err, instanceTemplate, apiResponse) {
     *   // `instanceTemplate` is an InstanceTemplate object.
     * });
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * instanceTemplate.get().then(function(data) {
     *   const instanceTemplate = data[0];
     *   const apiResponse = data[1];
     * });
     */
    get: true,

    /**
     * Get the instance template's metadata.
     *
     * @see [InstanceTemplates: get API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instanceTemplates/get}
     * @see [InstanceTemplates Resource]{@link https://cloud.google.com/compute/docs/reference/v1/instanceTemplates}
     *
     * @method InstanceTemplate#getMetadata
     * @param {function=} callback - The callback function.
     * @param {?error} callback.err - An error returned while making this
     *     request.
     * @param {object} callback.metadata - The instance group's metadata.
     * @param {object} callback.apiResponse - The full API response.
     *
     * @example
     * const Compute = require('@google-cloud/compute');
     * const compute = new Compute();
     * const instanceTemplate = compute.instanceTemplate('my-instance-template');
     *
     * instanceTemplate.getMetadata(function(err, metadata, apiResponse) {});
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * instanceTemplate.getMetadata().then(function(data) {
     *   const metadata = data[0];
     *   const apiResponse = data[1];
     * });
     */
    getMetadata: true,
  };

  common.ServiceObject.call(this, {
    parent: compute,
    baseUrl: '/global/instanceTemplates',
    /**
     * @name InstanceTemplate#id
     * @type {string}
     */
    id: name,
    createMethod: compute.createInstanceTemplate.bind(compute),
    methods: methods,
  });

  /**
   * The parent {@link Compute} instance of this {@link InstanceTemplate} instance.
   * @name InstanceTemplate#compute
   * @type {Compute}
   */
  this.compute = compute;

  /**
   * @name InstanceTemplate#name
   * @type {string}
   */
  this.name = name;
}

util.inherits(InstanceTemplate, common.ServiceObject);

/**
 * Delete the instance template.
 *
 * @see [InstanceTemplates: delete API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instanceTemplates/delete}
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
 * const instanceTemplate = compute.instanceTemplate('my-instance-template');
 *
 * instanceTemplate.delete(function(err, operation, apiResponse) {
 *   // `operation` is an Operation object that can be used to check the status
 *   // of the request.
 * });
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * instanceTemplate.delete().then(function(data) {
 *   const operation = data[0];
 *   const apiResponse = data[1];
 * });
 */
InstanceTemplate.prototype.delete = function(callback) {
  var self = this;

  callback = callback || common.util.noop;

  common.ServiceObject.prototype.delete.call(this, function(err, resp) {
    if (err) {
      callback(err, null, resp);
      return;
    }

    var operation = self.compute.operation(resp.name);
    operation.metadata = resp;

    callback(null, operation, resp);
  });
};

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
common.util.promisifyAll(InstanceTemplate);

module.exports = InstanceTemplate;
