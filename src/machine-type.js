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

const common = require('@google-cloud/common');
const {teenyRequest} = require('teeny-request');

/**
 * A MachineType object allows you to interact with a Google Compute Engine
 * machine type.
 *
 * @see [Machine Types Overview]{@link https://cloud.google.com/compute/docs/machine-types}
 * @see [MachineType Resource]{@link https://cloud.google.com/compute/docs/reference/v1/machineTypes}
 *
 * @class
 * @param {Zone} zone
 * @param {string} name
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('us-central1-b');
 * const machineType = zone.machineType('g1-small');
 */
class MachineType extends common.ServiceObject {
  constructor(zone, name) {
    const methods = {
      /**
       * Check if the machine type exists.
       *
       * @method MachineType#create
       * @param {function} callback - The callback function.
       * @param {?error} callback.err - An error returned while making this
       *     request.
       * @param {boolean} callback.exists - Whether the machine type exists or
       *     not.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const zone = compute.zone('us-central1-b');
       * const machineType = zone.machineType('g1-small');
       *
       * machineType.exists(function(err, exists) {});
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * machineType.exists().then(function(data) {
       *   const exists = data[0];
       * });
       */
      exists: true,
      /**
       * Get a machine type if it exists.
       *
       * @method MachineType#get
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const zone = compute.zone('us-central1-b');
       * const machineType = zone.machineType('g1-small');
       *
       * machineType.get(function(err, machineType, apiResponse) {
       *   // `machineType` is a MachineType object.
       * });
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * machineType.get().then(function(data) {
       *   const machineType = data[0];
       *   const apiResponse = data[1];
       * });
       */
      get: true,
      /**
       * Get the machine type's metadata.
       *
       * @see [MachineTypes: get API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/machineTypes/get}
       * @see [MachineType Resource]{@link https://cloud.google.com/compute/docs/reference/v1/machineTypes}
       *
       * @method MachineType#getMetadata
       * @param {function=} callback - The callback function.
       * @param {?error} callback.err - An error returned while making this
       *     request.
       * @param {object} callback.metadata - The machine type's metadata.
       * @param {object} callback.apiResponse - The full API response.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const zone = compute.zone('us-central1-b');
       * const machineType = zone.machineType('g1-small');
       *
       * machineType.getMetadata(function(err, metadata, apiResponse) {});
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * machineType.getMetadata().then(function(data) {
       *   const metadata = data[0];
       *   const apiResponse = data[1];
       * });
       */
      getMetadata: true,
    };
    super({
      parent: zone,
      baseUrl: '/machineTypes',
      /**
       * @name MachineType#id
       * @type {string}
       */
      id: name,
      methods: methods,
      requestModule: teenyRequest,
    });
    /**
     * The parent {@link Zone} instance of this {@link MachineType} instance.
     * @name MachineType#zone
     * @type {Zone}
     */
    this.zone = zone;
    /**
     * @name MachineType#name
     * @type {string}
     */
    this.name = name;
  }
}

module.exports = MachineType;
