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
import type {ApiError, Metadata} from '@google-cloud/common';
import * as is from 'is';
import {promisifyAll} from '@google-cloud/promisify';

import type {Compute} from '.';
import type {BaseOptions} from './interfaces';
import type {OperationCallback} from './operation';
import type {Zone} from './zone';

export interface CreateServiceOptions extends BaseOptions {
  backends?: {
    description?: string;
    group?: string;
    balancingMode?: string;
    maxUtilization?: number;
    maxRate?: number;
    maxRatePerInstance?: number;
    maxRatePerEndpoint?: number;
    maxConnections?: number;
    maxConnectionsPerInstance?: number;
    maxConnectionsPerEndpoint?: number;
    capacityScaler?: number;
    failover?: boolean;
  }[];
  healthChecks?: string[];
  timeoutSec?: number;
  port?: number; // Deprecated
  protocol?: string;
  fingerprint?: string;
  portName?: string;
  enableCDN?: boolean;
  sessionAffinity?: string;
  affinityCookieTtlSec?: number;
  failoverPolicy?: {
    disableConnectionDrainOnFailover?: boolean;
    dropTrafficIfUnhealthy?: boolean;
    failoverRatio?: number;
  };
  loadBalancingScheme?: string;
  connectionDraining?: {
    drainingTimeoutSec?: number;
  };
  iap?: {
    enabled?: boolean;
    oauth2ClientId?: string;
    oauth2ClientSecret?: string;
  };
  cdnPolicy?: {
    cacheKeyPolicy?: {
      includeProtocol?: boolean;
      includeHost?: boolean;
      includeQueryString?: boolean;
      queryStringWhitelist?: string[];
      queryStringBlacklist?: string[];
    };
    signedUrlCacheMaxAgeSec?: string;
  };
  customRequestHeaders?: string[];
  logConfig?: {
    enable?: boolean;
    sampleRate?: number;
  };
  securitySettings?: {
    clientTlsPolicy?: string;
    subjectAltNames?: string[];
  };
  localityLbPolicy?: string;
  consistentHash?: {
    httpCookie?: {
      name?: string;
      path?: string;
      ttl?: {
        seconds?: string;
        nanos?: number;
      };
    };
    httpHeaderName?: string;
    minimumRingSize?: string;
  };
  circuitBreakers?: {
    maxRequestsPerConnection?: number;
    maxConnections?: number;
    maxPendingRequests?: number;
    maxRequests?: number;
    maxRetries?: number;
  };
  outlierDetection?: {
    consecutiveErrors?: number;
    interval?: {
      seconds?: string;
      nanos?: number;
    };
    baseEjectionTime?: {seconds?: string; nanos?: number};
    maxEjectionPercent?: number;
    enforcingConsecutiveErrors?: number;
    enforcingSuccessRate?: number;
    successRateMinimumHosts?: number;
    successRateRequestVolume?: number;
    successRateStdevFactor?: number;
    consecutiveGatewayFailure?: number;
    enforcingConsecutiveGatewayFailure?: number;
    network?: string;
  };
}
export interface GetHealthOptions {
  name?: string;
  zone?: Zone | string;
}
export type GetHealthCallback = (
  error: ApiError | null,
  statuses: Record<string, string>[] | null,
  apiResponse?: Metadata | null
) => void;
export type GetHealthPromise = Promise<[Record<string, string>[], Metadata]>;

/**
 * An HTTP(S) load balancing backend service is a centralized service for
 * managing backends, which in turn manage instances that handle user requests.
 * You configure your load balancing service to route requests to your backend
 * service. The backend service in turn knows which instances it can use, how
 * much traffic they can handle, and how much traffic they are currently
 * handling. In addition, the backend service monitors health checking and does
 * not send traffic to unhealthy instances.
 *
 * @see [Backend Services Overview]{@link https://cloud.google.com/compute/docs/load-balancing/http/backend-service}
 *
 * @class
 * @param {Compute} compute - The Compute instance this service inherits
 *     from.
 * @param {string} name - Name of the service.
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const service = const.service('service-name');
 */
export class Service extends ServiceObject {
  compute: Compute;
  name: string;
  constructor(compute: Compute, name: string) {
    const methods = {
      /**
       * Create a backend service.
       *
       * @method Service#create
       * @param {object} config - See {@link Compute#createService}.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const service = const.service('service-name');
       *
       * const config = {
       *   backends: [
       *     {
       *       group: 'URL of an Instance Group resource'
       *     }
       *   ],
       *   healthChecks: [
       *     'URL of an HTTP/HTTPS health check resource'
       *   ]
       * };
       *
       * service.create(config, function(err, service, operation, apiResponse) {
       *   // `service` is a Service object.
       *
       *   // `operation` is an Operation object that can be used to check the
       *   // of the request.
       * });
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * service.create(config).then(function(data) {
       *   const service = data[0];
       *   const operation = data[1];
       *   const apiResponse = data[2];
       * });
       */
      create: true,
      /**
       * Check if the backend service exists.
       *
       * @method Service#exists
       * @param {function} callback - The callback function.
       * @param {?error} callback.err - An error returned while making this
       *     request.
       * @param {boolean} callback.exists - Whether the backend service exists or
       *     not.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const service = const.service('service-name');
       *
       * service.exists(function(err, exists) {});
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * service.exists().then(function(data) {
       *   const exists = data[0];
       * });
       */
      exists: true,
      /**
       * Get a Service object if it exists.
       *
       * You may optionally use this to "get or create" an object by providing an
       * object with `autoCreate` set to `true`. Any extra configuration that is
       * normally required for the `create` method must be contained within this
       * object as well.
       *
       * @method Service#get
       * @param {options=} options - Configuration object.
       * @param {boolean} options.autoCreate - Automatically create the object if
       *     it does not exist. Default: `false`
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const service = const.service('service-name');
       *
       * service.get(function(err, service, apiResponse) {
       *   // `service` is a Service object.
       * });
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * service.get().then(function(data) {
       *   const service = data[0];
       *   const apiResponse = data[1];
       * });
       */
      get: true,
      /**
       * Get the metadata of this backend service.
       *
       * @see [BackendService Resource]{@link https://cloud.google.com/compute/docs/reference/v1/backendServices#resource}
       * @see [BackendService: get API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/backendServices/get}
       *
       * @method Service#getMetadata
       * @param {function=} callback - The callback function.
       * @param {?error} callback.err - An error returned while making this
       *     request.
       * @param {object} callback.metadata - The service's metadata.
       * @param {object} callback.apiResponse - The full API response.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const service = const.service('service-name');
       *
       * service.getMetadata(function(err, metadata, apiResponse) {});
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * service.getMetadata().then(function(data) {
       *   const metadata = data[0];
       *   const apiResponse = data[1];
       * });
       */
      getMetadata: true,
    };
    super({
      parent: compute,
      baseUrl: '/global/backendServices',
      /**
       * @name Service#id
       * @type {string}
       */
      id: name,
      createMethod: compute.createService.bind(compute),
      methods: methods,
      pollIntervalMs: compute.pollIntervalMs,
    });
    /**
     * The parent {@link Compute} instance of this {@link Service} instance.
     * @name Service#compute
     * @type {Compute}
     */
    this.compute = compute;
    /**
     * @name Service#name
     * @type {string}
     */
    this.name = name;
  }
  /**
   * Delete the backend service.
   *
   * @see [BackendServices: delete API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/backendServices/delete}
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
   * const service = const.service('service-name');
   *
   * service.delete(function(err, operation, apiResponse) {
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * service.delete().then(function(data) {
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
      const operation = this.compute.operation(resp.name);
      operation.metadata = resp;
      callback!(null, operation, resp);
    });
  }
  /**
   * Get the most recent health check results.
   *
   * @see [BackendServices: getHealth API Documentation]{@link https://cloud.google.com/compute/docs/reference/latest/backendServices/getHealth}
   *
   * @param {string|object} group - The fully-qualified URL of an Instance Group
   *     resource.
   * @param {string} group.name - The name of the Instance Group resource.
   * @param {Zone|string} group.zone - The name of the zone or a
   *     Zone object.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {object[]} callback.status - A list of health checks and their
   *     corresponding status.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const service = const.service('service-name');
   *
   * const group = {
   *   name: 'instance-group-name',
   *   zone: 'us-central1-a'
   * };
   *
   * service.getHealth(group, function(err, status, apiResponse) {
   *   if (!err) {
   *     // status = [
   *     //   {
   *     //      ipAddress: '...',
   *     //      instance: '...',
   *     //      healthState: '...',
   *     //      port: '...'
   *     //   }
   *     // ]
   *   }
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * service.getHealth(group).then(function(data) {
   *   const status = data[0];
   *   const apiResponse = data[1];
   * });
   */
  getHealth(
    group: string | GetHealthOptions,
    callback: GetHealthCallback
  ): void;
  getHealth(group: string | GetHealthOptions): GetHealthPromise;
  getHealth(
    group: string | GetHealthOptions,
    callback?: GetHealthCallback
  ): void | GetHealthPromise {
    if (!is.string(group)) {
      group = `https://www.googleapis.com/compute/v1/projects/${
        (this.parent as Compute).projectId
      }/zones/${
        is.string((group as GetHealthOptions).zone)
          ? (group as GetHealthOptions).zone
          : ((group as GetHealthOptions).zone as Zone).name
      }/instanceGroups/${(group as GetHealthOptions).name}`;
    }
    this.request(
      {method: 'POST', uri: '/getHealth', json: {group: group}},
      (err, resp) => {
        if (err) {
          callback!(err, null, resp);
          return;
        }
        callback!(null, arrify(resp.healthStatus), resp);
      }
    );
  }
  /**
   * Set the backend service's metadata.
   *
   * @see [BackendService Resource]{@link https://cloud.google.com/compute/docs/reference/v1/backendServices#resource}
   *
   * @param {object} metadata - See a
   *     [BackendService resource](https://cloud.google.com/compute/docs/reference/v1/backendServices#resource).
   * @param {function=} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const service = const.service('service-name');
   *
   * const metadata = {
   *   description: 'New description'
   * };
   *
   * service.setMetadata(metadata, function(err, operation, apiResponse) {
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * service.setMetadata(metadata).then(function(data) {
   *   const operation = data[0];
   *   const apiResponse = data[1];
   * });
   */
  setMetadata(
    metadata: Metadata | undefined,
    callback: OperationCallback
  ): void;
  setMetadata(metadata?: Metadata): Promise<[Metadata]>;
  setMetadata(
    metadata?: Metadata,
    callback?: OperationCallback
  ): void | Promise<[Metadata]> {
    callback = callback || util.noop;
    this.request({method: 'PATCH', uri: '', json: metadata}, (err, resp) => {
      if (err) {
        callback!(err, null, resp);
        return;
      }
      const operation = this.compute.operation(resp.name);
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
promisifyAll(Service);
