/*!
 * Copyright 2017 Google Inc. All Rights Reserved.
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
const {promisifyAll} = require('@google-cloud/promisify');
const {teenyRequest} = require('teeny-request');

/**
 * A Project object allows you to interact with your Google Compute Engine
 * project.
 *
 * @see [Projects Overview]{@link https://cloud.google.com/compute/docs/projects}
 * @see [Projects Resource]{@link https://cloud.google.com/compute/docs/reference/v1/projects}
 *
 * @class
 * @param {Compute} compute - Compute object this project belongs to.
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const project = compute.project();
 */
class Project extends common.ServiceObject {
  constructor(compute) {
    const methods = {
      /**
       * Get a Project object.
       *
       * @method Project#get
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const project = compute.project();
       *
       * project.get(function(err, project, apiResponse) {
       *   // `project` is a Project object.
       * });
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * project.get().then(function(data) {
       *   const project = data[0];
       *   const apiResponse = data[1];
       * });
       */
      get: true,
      /**
       * Get the project's metadata.
       *
       * @see [Projects: get API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/projects/get}
       * @see [Projects Resource]{@link https://cloud.google.com/compute/docs/reference/v1/projects}
       *
       * @method Project#getMetadata
       * @param {function=} callback - The callback function.
       * @param {?error} callback.err - An error returned while making this
       *     request.
       * @param {object} callback.metadata - The machine type's metadata.
       * @param {object} callback.apiResponse - The full API response.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const project = compute.project();
       *
       * project.getMetadata(function(err, metadata, apiResponse) {});
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * project.getMetadata().then(function(data) {
       *   var metadata = data[0];
       *   var apiResponse = data[1];
       * });
       */
      getMetadata: true,
    };
    super({
      parent: compute,
      baseUrl: '',
      id: '',
      methods: methods,
      requestModule: teenyRequest,
    });
  }
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(Project);

/**
 * Reference to the {@link Project} class.
 * @name module:@google-cloud/compute.Project
 * @see Project
 */
module.exports = Project;
