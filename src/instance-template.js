/*!
 * Copyright 2020 Google LLC. All Rights Reserved.
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

const format = require('string-format-obj');
const common = require('@google-cloud/common');
const {promisifyAll} = require('@google-cloud/promisify');

/**
 * You can create and manage templates for virtual machine instances
 * so that you don't have to individually define properties of instances
 * in your project.
 *
 * @see [Creating Instance Templates]{@link https://cloud.google.com/compute/docs/instance-templates}
 *
 * @class
 * @param {string} name
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const instanceTemplate = compute.instanceTemplate('web-servers');
 */
class InstanceTemplate extends common.ServiceObject {
  constructor(compute, name) {
    const methods = {
      /**
       * Create an instance template.
       *
       * @method InstanceTemplate#create
       * @param {object=} options - See {@link Compute#createInstanceTemplate}.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const instanceTemplate = compute.instanceTemplate('web-servers');
       *
       * function onCreated(err, instanceTemplate, operation, apiResponse) {
       *   // `instanceTemplate` is an InstanceTemplate object.
       *
       *   // `operation` is an Operation object that can be used to check the
       *   // status of the request.
       * }
       *
       * instanceTemplate.create(onCreated);
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * instanceTemplate.create().then(function(data) {
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
       * @param {boolean} callback.exists - Whether the instance template exists or
       *     not.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const instanceTemplate = compute.instanceTemplate('web-servers');
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
       * const instanceTemplate = compute.instanceTemplate('web-servers');
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
    };
    super({
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
    /**
     * @name InstanceTemplate#formattedName
     * @type {string}
     */
    this.formattedName = InstanceTemplate.formatName_(compute, name);
  }
  /**
   * Delete the instance template.
   *
   * @see [InstanceTemplates: delete API Documentation]{@link https://cloud.google.com/compute/docs/reference/rest/v1/instanceTemplates/delete}
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
   * const instanceTemplate = compute.instanceTemplate('web-servers');
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
  delete(callback) {
    const self = this;
    callback = callback || common.util.noop;
    super.delete(function(err, resp) {
      if (err) {
        callback(err, null, resp);
        return;
      }
      const operation = self.compute.operation(resp.name);
      operation.metadata = resp;
      callback(null, operation, resp);
    });
  }
  /**
   * Format a instance template's name how the API expects.
   *
   * @private
   *
   * @param {Compute} compute - The Compute object this instance template belongs to.
   * @param {string} name - The name of the instance template.
   * @returns {string} - The formatted name.
   */
  static formatName_(compute, name) {
    return format('projects/{projectId}/global/instanceTemplates/{name}', {
      projectId: compute.projectId,
      name: name,
    });
  }
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(InstanceTemplate);

module.exports = InstanceTemplate;
