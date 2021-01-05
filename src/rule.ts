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

import type {Compute} from '.';
import type {BaseOptions, IPVersion, NetworkTier, Protocol} from './interfaces';
import type {OperationCallback, OperationPromise} from './operation';
import type {Region} from './region';

export interface CreateRuleOptions extends BaseOptions {
  ip?: string;
  IPAddress?: string;
  protocol?: Protocol;
  IPProtocol?: Protocol;
  range?: string;
  portRange?: string;
  target?: string;
  ports?: string[];
  loadBalancingScheme?:
    | 'EXTERNAL'
    | 'INTERNAL'
    | 'INTERNAL_MANAGED'
    | 'INTERNAL_SELF_MANAGED';
  subnetwork?: string;
  network?: string;
  backendService?: string;
  serviceLabel?: string;
  networkTier?: NetworkTier;
  ipVersion?: IPVersion;
  fingerprint?: string;
  allPorts?: boolean;
  allowGlobalAccess?: boolean;
  metadataFilters?: {
    filterMatchCriteria?: 'MATCH_ANY' | 'MATCH_ALL';
    filterLabels?: {name?: string; value?: string}[];
  }[];
  isMirroringCollector?: boolean;
}

/**
 * Forwarding rules work in conjunction with target pools and target instances
 * to support load balancing and protocol forwarding features. To use load
 * balancing and protocol forwarding, you must create a forwarding rule that
 * directs traffic to specific target pools (for load balancing) or target
 * instances (for protocol forwarding).
 *
 * @see [Forwarding rules]{@link https://cloud.google.com/compute/docs/load-balancing/network/forwarding-rules}
 *
 * @class
 * @param {Compute|Region} scope - The parent scope this
 *     firewall rule belongs to.
 * @param {string} name - Rule name.
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 *
 * //-
 * // Reference a global rule.
 * //-
 * const rule = compute.rule('rule-name');
 *
 * //-
 * // Reference a region rule.
 * //-
 * const region = compute.region('us-central1');
 * const rule = region.rule('rule-name');
 */
export class Rule extends ServiceObject {
  name?: string;
  scope: Compute | Region;
  constructor(scope: Compute | Region, name: string) {
    const isGlobalRule = scope.constructor.name === 'Compute';
    const methods = {
      /**
       * Create a forwarding rule.
       *
       * @method Rule#create
       * @param {object} config - See {@link Compute#createRule} or
       *     {@link Region#createRule} if accessing this object through
       *     a Region.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const rule = region.rule('rule-name');
       *
       * const config = {
       *   // `target` will be different depending of this is a Regional or Global
       *   // forwarding rule
       *   target: 'global/targetHttpProxies/my-proxy',
       *   portRange: '8080-8089'
       * };
       *
       * rule.create(config, function(err, rule, operation, apiResponse) {
       *   // `rule` is a Rule object.
       *
       *   // `operation` is an Operation object that can be used to check the
       *   // of the request.
       * });
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * rule.create(config).then(function(data) {
       *   const rule = data[0];
       *   const operation = data[1];
       *   const apiResponse = data[2];
       * });
       */
      create: true,
      /**
       * Check if the forwarding rule exists.
       *
       * @method Rule#exists
       * @param {function} callback - The callback function.
       * @param {?error} callback.err - An error returned while making this
       *     request.
       * @param {boolean} callback.exists - Whether the rule exists or not.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const rule = region.rule('rule-name');
       *
       * rule.exists(function(err, exists) {});
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * rule.exists().then(function(data) {
       *   const exists = data[0];
       * });
       */
      exists: true,
      /**
       * Get a forwarding rule if it exists.
       *
       * You may optionally use this to "get or create" an object by providing an
       * object with `autoCreate` set to `true`. Any extra configuration that is
       * normally required for the `create` method must be contained within this
       * object as well.
       *
       * @method Rule#get
       * @param {options=} options - Configuration object.
       * @param {boolean} options.autoCreate - Automatically create the object if
       *     it does not exist. Default: `false`
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const rule = region.rule('rule-name');
       *
       * rule.get(function(err, rule, apiResponse) {
       *   // `rule` is a Rule object.
       * });
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * rule.get().then(function(data) {
       *   const rule = data[0];
       *   const apiResponse = data[1];
       * });
       */
      get: true,
      /**
       * Get the metadata of this rule.
       *
       * @see [GlobalForwardingRule Resource]{@link https://cloud.google.com/compute/docs/reference/v1/globalForwardingRules#resource}
       * @see [ForwardingRule Resource]{@link https://cloud.google.com/compute/docs/reference/v1/globalForwardingRules#resource}
       * @see [GlobalForwardingRules: get API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/globalForwardingRules/get}
       * @see [ForwardingRules: get API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/forwardingRules/get}
       *
       * @method Rule#getMetadata
       * @param {function=} callback - The callback function.
       * @param {?error} callback.err - An error returned while making this
       *     request.
       * @param {object} callback.metadata - The rule's metadata.
       * @param {object} callback.apiResponse - The full API response.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const rule = region.rule('rule-name');
       *
       * rule.getMetadata(function(err, metadata, apiResponse) {});
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * rule.getMetadata().then(function(data) {
       *   const metadata = data[0];
       *   const apiResponse = data[1];
       * });
       */
      getMetadata: true,
    };
    super({
      parent: scope,
      baseUrl: (isGlobalRule ? '/global' : '') + '/forwardingRules',
      /**
       * @name Rule#id
       * @type {string}
       */
      id: name,
      createMethod: scope.createRule.bind(scope),
      methods: methods,
      pollIntervalMs: isGlobalRule
        ? scope.pollIntervalMs
        : (scope as Region).compute.pollIntervalMs,
    });
    /**
     * @name Rule#scope
     * @type {Compute|Region}
     */
    this.scope = scope;
  }
  delete(): Promise<[Metadata]>;
  delete(callback: OperationCallback): void;
  /**
   * Delete the rule.
   *
   * @see [GlobalForwardingRules: delete API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/globalForwardingRules/delete}
   * @see [ForwardingRules: delete API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/forwardingRules/delete}
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
   * const rule = compute.rule('rule-name');
   *
   * rule.delete(function(err, operation, apiResponse) {
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * rule.delete().then(function(data) {
   *   const operation = data[0];
   *   const apiResponse = data[1];
   * });
   */
  delete(callback?: OperationCallback): void | Promise<[Metadata]> {
    callback = callback || util.noop;
    const scope = this.scope;
    this.request({method: 'DELETE', uri: ''}, (err, resp) => {
      if (err) {
        callback?.(err, null, resp);
        return;
      }
      const operation = scope.operation(resp.name);
      operation.metadata = resp;
      callback?.(null, operation, resp);
    });
  }
  setTarget(target: string): OperationPromise;
  setTarget(target: string, callback: OperationCallback): void;
  /**
   * Set the target for this forwarding rule.
   *
   * @see [GlobalForwardingRules: setTarget API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/globalForwardingRules/setTarget}
   * @see [ForwardingRules: setTarget API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/forwardingRules/setTarget}
   *
   * @param {string} target - The full or valid partial URL of the target resource
   *     to receive the matched traffic. For regional forwarding rules, this
   *     target must live in the same region as the forwarding rule. For global
   *     forwarding rules, this target must be a global `TargetHttpProxy`
   *     resource.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const rule = compute.rule('rule-name');
   *
   * rule.setTarget('new-target', function(err, operation, apiResponse) {
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * rule.setTarget('new-target').then(function(data) {
   *   const operation = data[0];
   *   const apiResponse = data[1];
   * });
   */
  setTarget(
    target: string,
    callback?: OperationCallback
  ): void | OperationPromise {
    callback = callback || util.noop;
    const scope = this.scope;
    this.request(
      {method: 'POST', uri: '/setTarget', json: {target: target}},
      (err, resp) => {
        if (err) {
          callback?.(err, null, resp);
          return;
        }
        const operation = scope.operation(resp.name);
        operation.metadata = resp;
        callback?.(null, operation, resp);
      }
    );
  }
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(Rule);
