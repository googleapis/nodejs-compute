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
import type {DecorateRequestOptions, Metadata} from '@google-cloud/common';
import {promisifyAll} from '@google-cloud/promisify';
import {paginator} from '@google-cloud/paginator';

import type {Compute} from '.';
import {Address} from './address';
import type {CreateAddressOptions} from './address';
import {Network} from './network';
import {Operation} from './operation';
import type {CreateResourceCallback, CreateResourcePromise} from './operation';
import {Rule} from './rule';
import type {CreateRuleOptions} from './rule';
import {Subnetwork} from './subnetwork';
import type {CreateSubnetworkOptions} from './subnetwork';
import type {
  GetResourcesCallback,
  GetResourcesOptions,
  GetResourcesPromise,
  GetResourcesStream,
} from './interfaces';

/**
 * A Region object allows you to interact with a Google Compute Engine region.
 *
 * @see [Regions & Zones Overview]{@link https://cloud.google.com/compute/docs/zones}
 * @see [Region Resource]{@link https://cloud.google.com/compute/docs/reference/v1/regions}
 *
 * @class
 * @param {Compute} compute
 * @param {string} name
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const region = compute.region('us-central1');
 */
export class Region extends ServiceObject {
  name: string;
  compute: Compute;
  /**
   * Get a list of {@link Address} objects in this region as a readable
   * object stream.
   *
   * @param {object=} options - Configuration object. See
   *     {@link Region#getAddresses} for a complete list of options.
   * @returns {stream}
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const region = compute.region('us-central1');
   *
   * region.getAddressesStream()
   *   .on('error', console.error)
   *   .on('data', function(address) {
   *     // `address` is an `Address` object.
   *   })
   *   .on('end', function() {
   *     // All addresses retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * region.getAddressesStream()
   *   .on('data', function(address) {
   *     this.end();
   *   });
   */
  getAddressesStream: GetResourcesStream<Address>;
  /**
   * Get a list of {@link Operation} objects for this region as a
   * readable object stream.
   *
   * @param {object=} options - Configuration object. See
   *     {@link Region#getOperations} for a complete list of options.
   * @returns {stream}
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const region = compute.region('us-central1');
   *
   * region.getOperationsStream()
   *   .on('error', console.error)
   *   .on('data', function(operation) {
   *     // `operation` is an `Operation` object.
   *   })
   *   .on('end', function() {
   *     // All operations retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * region.getOperationsStream()
   *   .on('data', function(operation) {
   *     this.end();
   *   });
   */
  getOperationsStream: GetResourcesStream<Operation>;
  /**
   * Get a list of {@link Rule} objects in this region as a readable
   * object stream.
   *
   * @param {object=} options - Configuration object. See
   *     {@link Region#getRulesStream} for a complete list of options.
   * @returns {stream}
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const region = compute.region('us-central1');
   *
   * region.getRulesStream()
   *   .on('error', console.error)
   *   .on('data', function(rule) {
   *     // `rule` is a `Rule` object.
   *   })
   *   .on('end', function() {
   *     // All rules retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * region.getRulesStream()
   *   .on('data', function(rule) {
   *     this.end();
   *   });
   */
  getRulesStream: GetResourcesStream<Rule>;
  /**
   * Get a list of {@link Subnetwork} objects in this region as a
   * readable object stream.
   *
   * @param {object=} options - Configuration object. See
   *     {@link Region#getSubnetworks} for a complete list of options.
   * @returns {stream}
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const region = compute.region('us-central1');
   *
   * region.getSubnetworksStream()
   *   .on('error', console.error)
   *   .on('data', function(subnetwork) {
   *     // `subnetwork` is a `Subnetwork` object.
   *   })
   *   .on('end', function() {
   *     // All subnetworks retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * region.getSubnetworksStream()
   *   .on('data', function(subnetwork) {
   *     this.end();
   *   });
   */
  getSubnetworksStream: GetResourcesStream<Subnetwork>;
  constructor(compute: Compute, name: string) {
    const methods = {
      /**
       * Check if the region exists.
       *
       * @method Region#exists
       * @param {function} callback - The callback function.
       * @param {?error} callback.err - An error returned while making this
       *     request.
       * @param {boolean} callback.exists - Whether the region exists or not.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const region = compute.region('us-central1');
       *
       * region.exists(function(err, exists) {});
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * region.exists().then(function(data) {
       *   const exists = data[0];
       * });
       */
      exists: true,
      /**
       * Get a region.
       *
       * @method Region#get
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const region = compute.region('us-central1');
       *
       * region.get(function(err, region, apiResponse) {
       *   // `region` is a Region object.
       * });
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * region.get().then(function(data) {
       *   const region = data[0];
       *   const apiResponse = data[1];
       * });
       */
      get: true,
      /**
       * Get the region's metadata.
       *
       * @see [Region Resource]{@link https://cloud.google.com/compute/docs/reference/v1/regions}
       * @see [Regions: get API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/regions/get}
       *
       * @method Region#getMetadata
       * @param {function=} callback - The callback function.
       * @param {?error} callback.err - An error returned while making this
       *     request.
       * @param {object} callback.metadata - The region's metadata.
       * @param {object} callback.apiResponse - The full API response.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const region = compute.region('us-central1');
       *
       * region.getMetadata(function(err, metadata, apiResponse) {});
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * region.getMetadata().then(function(data) {
       *   const metadata = data[0];
       *   const apiResponse = data[1];
       * });
       */
      getMetadata: true,
    };
    super({
      parent: compute,
      baseUrl: '/regions',
      /**
       * @name Region#id
       * @type {string}
       */
      id: name,
      methods: methods,
      pollIntervalMs: compute.pollIntervalMs,
    });
    /**
     * @name Region#name
     * @type {string}
     */
    this.name = name;
    this.compute = compute;
    this.interceptors.push({
      request: function (reqOpts: DecorateRequestOptions) {
        if (reqOpts.uri.indexOf('/global/forwardingRules') > -1) {
          reqOpts.uri = reqOpts.uri.replace('/global', '');
        }
        return reqOpts;
      },
    });
    this.getAddressesStream = paginator.streamify('getAddresses');
    this.getOperationsStream = paginator.streamify('getOperations');
    this.getRulesStream = paginator.streamify('getRules');
    this.getSubnetworksStream = paginator.streamify('getSubnetworks');
  }
  /**
   * Get a reference to a Google Compute Engine address in this region.
   *
   * @see [Instances and Networks]{@link https://cloud.google.com/compute/docs/instances-and-network}
   *
   * @param {string} name - Name of the address.
   * @returns {Address}
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const region = compute.region('us-central1');
   *
   * const address = region.address('address-name');
   */
  address(name: string): Address {
    return new Address(this, name);
  }
  /**
   * Create an address in this region.
   *
   * @see [Instances and Networks]{@link https://cloud.google.com/compute/docs/instances-and-network}
   * @see [Address Resource]{@link https://cloud.google.com/compute/docs/reference/v1/addresses}
   * @see [Addresses: insert API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/addresses/insert}
   *
   * @param {string} name - Name of the address.
   * @param {object=} options - See an
   *     [Address resource](https://cloud.google.com/compute/docs/reference/v1/addresses).
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Address} callback.address - The created Address
   *     object.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const region = compute.region('us-central1');
   *
   * function callback(err, address, operation, apiResponse) {
   *   // `address` is an Address object.
   *
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * }
   *
   * region.createAddress('new-address', callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * region.createAddress('new-address').then(function(data) {
   *   const address = data[0];
   *   const operation = data[1];
   *   const apiResponse = data[2];
   * });
   */
  createAddress(
    name: string,
    options: CreateAddressOptions,
    callback: CreateResourceCallback<Address>
  ): void;
  createAddress(name: string, callback: CreateResourceCallback<Address>): void;
  createAddress(
    name: string,
    options?: CreateAddressOptions
  ): CreateResourcePromise<Address>;
  createAddress(
    name: string,
    options?: CreateAddressOptions | CreateResourceCallback<Address>,
    callback?: CreateResourceCallback<Address>
  ): void | CreateResourcePromise<Address> {
    const [opts, cb] = util.maybeOptionsOrCallback<
      CreateAddressOptions,
      CreateResourceCallback<Address>
    >(options, callback);
    this.request(
      {
        method: 'POST',
        uri: '/addresses',
        json: Object.assign({}, opts, {name: name}),
      },
      (err, resp) => {
        if (err) {
          cb(err, null, null, resp);
          return;
        }
        const address = this.address(name);
        const operation = this.operation(resp.name);
        operation.metadata = resp;
        cb(null, address, operation, resp);
      }
    );
  }
  /**
   * Create a subnetwork in this region.
   *
   * @see [Subnetwork Resource]{@link https://cloud.google.com/compute/docs/reference/v1/subnetworks#resource}
   * @see [Subnetwork: insert API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/subnetworks/insert}
   *
   * @param {string} name - Name of the subnetwork.
   * @param {object} config - See a
   *     [Subnetwork resource](https://cloud.google.com/compute/docs/reference/v1/subnetworks#resource).
   * @param {Network|string} config.network - The network to which
   *    this subnetwork belongs. **Only networks that are in the distributed mode
   *    can have subnetworks.**
   * @param {string} config.range - The range of internal addresses that
   *    are owned by this subnetwork. [CIDR](http://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing) range
   *    of addresses that are legal on this network. (Alias for
   *    `config.ipCidrRange`)
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Subnetwork} callback.subnetwork - The created
   *    Subnetwork object.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const region = compute.region('us-central1');
   *
   * const config = {
   *   network: 'network1',
   *   range: '10.0.1.0/24'
   * };
   *
   * function callback(err, subnetwork, operation, apiResponse) {
   *   // `subnetwork` is a Subnetwork object.
   *
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * }
   *
   * region.createSubnetwork('new-subnetwork-name', config, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * region.createSubnetwork('new-subnetwork-name', config).then(function(data) {
   *   const subnetwork = data[0];
   *   const operation = data[1];
   *   const apiResponse = data[2];
   * });
   */
  createSubnetwork(
    name: string,
    config: CreateSubnetworkOptions,
    callback: CreateResourceCallback<Subnetwork>
  ): void;
  createSubnetwork(
    name: string,
    config: CreateSubnetworkOptions
  ): CreateResourcePromise<Subnetwork>;
  createSubnetwork(
    name: string,
    config: CreateSubnetworkOptions,
    callback?: CreateResourceCallback<Subnetwork>
  ): void | CreateResourcePromise<Subnetwork> {
    const body = Object.assign({}, config, {name: name});
    if (body.network instanceof Network) {
      body.network = body.network.formattedName;
    }
    if (body.range) {
      body.ipCidrRange = body.range;
      delete body.range;
    }
    this.request(
      {method: 'POST', uri: '/subnetworks', json: body},
      (err, resp) => {
        if (err) {
          callback!(err, null, null, resp);
          return;
        }
        const subnetwork = this.subnetwork(name);
        const operation = this.operation(resp.name);
        operation.metadata = resp;
        callback!(null, subnetwork, operation, resp);
      }
    );
  }
  /**
   * Create a forwarding rule in this region.
   *
   * @see [ForwardingRule Resource]{@link https://cloud.google.com/compute/docs/reference/v1/forwardingRules#resource}
   * @see [ForwardingRules: insert API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/forwardingRules/insert}
   *
   * @param {string} name - Name of the rule.
   * @param {object} config - See a
   *     [ForwardingRule resource](https://cloud.google.com/compute/docs/reference/v1/forwardingRules#resource).
   * @param {string=} config.ip - The single IP address this forwarding rule will
   *     match against. All traffic that matches the IP address, protocol, and
   *     ports of this forwarding rule will be handled by this rule. If specified,
   *     the IP address must be a static external IP address. To create a new
   *     ephemeral external IP address for the forwarding rule, leave this field
   *     empty. (Alias for `config.IPAddress`)
   * @param {string=} config.protocol - The type of protocol that this forwarding
   *     rule matches. Valid values are `AH`, `ESP`, `SCTP`, `TCP`, `UDP`.
   *     Default: `TCP`. (Alias for `config.IPProtocol`)
   * @param {string=} config.range - A single port or single contiguous port
   *     range, ranging from low to high for which this forwarding rule matches.
   *     Packets of the specified protocol sent to these ports will be forwarded
   *     on to the appropriate target pool or target instance. If this field is
   *     left empty, then the forwarding matches traffic for all ports for the
   *     specified protocol. (Alias for `config.portRange`)
   * @param {string} config.target - The full or valid partial URL of the target
   *     resource to receive the matched traffic.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Rule} callback.rule - The created Rule object.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const region = compute.region('us-central1');
   *
   * const name = 'new-rule-name';
   *
   * const cfg = {
   *   target: 'zones/us-central1-a/targetInstances/my-target-instance',
   *   range: '8080-8089'
   * };
   *
   * region.createRule(name, cfg, function (err, rule, operation, apiResponse) {
   *   // `rule` is a Rule object.
   *
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * region.createRule(name, cfg).then(function(data) {
   *   const rule = data[0];
   *   const operation = data[1];
   *   const apiResponse = data[2];
   * });
   */
  createRule(
    name: string,
    config: CreateRuleOptions,
    callback: CreateResourceCallback<Rule>
  ): void;
  createRule(
    name: string,
    config: CreateRuleOptions
  ): CreateResourcePromise<Rule>;
  createRule(
    name: string,
    config: CreateRuleOptions,
    callback?: CreateResourceCallback<Rule>
  ): void | CreateResourcePromise<Rule> {
    (this.parent as Compute).createRule.call(this, name, config, callback!);
  }
  /**
   * Get a list of addresses in this region.
   *
   * @see [Instances and Networks]{@link https://cloud.google.com/compute/docs/instances-and-network}
   * @see [Addresses: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/addresses/list}
   *
   * @param {object=} options - Address search options.
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
   * @param {number} options.maxResults - Maximum number of addresses to return.
   * @param {string} options.pageToken - A previously-returned page token
   *     representing part of the larger set of results to view.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Address[]} callback.addresses - Address objects from
   *     this region.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const region = compute.region('us-central1');
   *
   * region.getAddresses(function(err, addresses) {
   *   // `addresses` is an array of `Address` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, addresses, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     region.getAddresses(nextQuery, callback);
   *   }
   * }
   *
   * region.getAddresses({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * region.getAddresses().then(function(data) {
   *   const addresses = data[0];
   * });
   */
  getAddresses(
    options: GetResourcesOptions,
    callback: GetResourcesCallback<Address>
  ): void;
  getAddresses(callback: GetResourcesCallback<Address>): void;
  getAddresses(options?: GetResourcesOptions): GetResourcesPromise<Address>;
  getAddresses(
    options?: GetResourcesOptions | GetResourcesCallback<Address>,
    callback?: GetResourcesCallback<Address>
  ): void | GetResourcesPromise<Address> {
    const [opts, cb] = util.maybeOptionsOrCallback<
      GetResourcesOptions,
      GetResourcesCallback<Address>
    >(options, callback);
    this.request({uri: '/addresses', qs: opts}, (err, resp) => {
      if (err) {
        cb(err, null, null, resp);
        return;
      }
      let nextQuery = null;
      if (resp.nextPageToken) {
        nextQuery = Object.assign({}, opts, {pageToken: resp.nextPageToken});
      }
      const addresses = ((resp.items as Metadata[]) || []).map(address => {
        const addressInstance = this.address(address.name);
        addressInstance.metadata = address;
        return addressInstance;
      });
      cb(null, addresses, nextQuery, resp);
    });
  }
  /**
   * Get a list of operations for this region.
   *
   * @see [Region Operation Overview]{@link https://cloud.google.com/compute/docs/reference/v1/regionOperations}
   * @see [RegionOperations: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/regionOperations/list}
   *
   * @param {object=} options - Operation search options.
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
   * @param {number} options.maxResults - Maximum number of operations to return.
   * @param {string} options.pageToken - A previously-returned page token
   *     representing part of the larger set of results to view.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Operation[]} callback.operations - Operation objects
   *     from this region.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const region = compute.region('us-central1');
   *
   * region.getOperations(function(err, operations) {
   *   // `operations` is an array of `Operation` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, operations, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     region.getOperations(nextQuery, callback);
   *   }
   * }
   *
   * region.getOperations({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * region.getOperations().then(function(data) {
   *   const operations = data[0];
   * });
   */
  getOperations(
    options: GetResourcesOptions,
    callback: GetResourcesCallback<Operation>
  ): void;
  getOperations(callback: GetResourcesCallback<Operation>): void;
  getOperations(options?: GetResourcesOptions): GetResourcesPromise<Operation>;
  getOperations(
    options?: GetResourcesOptions | GetResourcesCallback<Operation>,
    callback?: GetResourcesCallback<Operation>
  ): void | GetResourcesPromise<Operation> {
    const [opts, cb] = util.maybeOptionsOrCallback<
      GetResourcesOptions,
      GetResourcesCallback<Operation>
    >(options, callback);
    this.request({uri: '/operations', qs: opts}, (err, resp) => {
      if (err) {
        cb(err, null, null, resp);
        return;
      }
      let nextQuery = null;
      if (resp.nextPageToken) {
        nextQuery = Object.assign({}, opts, {pageToken: resp.nextPageToken});
      }
      const operations = ((resp.items as Metadata[]) || []).map(operation => {
        const operationInstance = this.operation(operation.name);
        operationInstance.metadata = operation;
        return operationInstance;
      });
      cb(null, operations, nextQuery, resp);
    });
  }
  /**
   * Get a list of forwading rules in this region.
   *
   * @see [ForwardingRules: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/forwardingRules/list}
   *
   * @param {object=} options - Rules search options.
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
   * @param {number} options.maxResults - Maximum number of rules to return.
   * @param {string} options.pageToken - A previously-returned page token
   *     representing part of the larger set of results to view.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Rule[]} callback.rules - Rule objects from this
   *     region.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const region = compute.region('us-central1');
   *
   * region.getRules(function(err, rules) {
   *   // `rules` is an array of `Rule` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, rules, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     region.getRules(nextQuery, callback);
   *   }
   * }
   *
   * region.getRules({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * region.getRules().then(function(data) {
   *   const rules = data[0];
   * });
   */
  getRules(
    options: GetResourcesOptions,
    callback: GetResourcesCallback<Rule>
  ): void;
  getRules(callback: GetResourcesCallback<Rule>): void;
  getRules(options?: GetResourcesOptions): GetResourcesPromise<Rule>;
  getRules(
    options?: GetResourcesOptions | GetResourcesCallback<Rule>,
    callback?: GetResourcesCallback<Rule>
  ): void | GetResourcesPromise<Rule> {
    const [opts, cb] = util.maybeOptionsOrCallback<
      GetResourcesOptions,
      GetResourcesCallback<Rule>
    >(options, callback);
    this.request({uri: '/forwardingRules', qs: opts}, (err, resp) => {
      if (err) {
        cb(err, null, null, resp);
        return;
      }
      let nextQuery = null;
      if (resp.nextPageToken) {
        nextQuery = Object.assign({}, opts, {pageToken: resp.nextPageToken});
      }
      const rules = ((resp.items as Metadata[]) || []).map(rule => {
        const ruleInstance = this.rule(rule.name);
        ruleInstance.metadata = rule;
        return ruleInstance;
      });
      cb(null, rules, nextQuery, resp);
    });
  }
  /**
   * Get a list of subnetworks in this region.
   *
   * @see [Subnetworks Overview]{@link https://cloud.google.com/compute/docs/subnetworks}
   * @see [Subnetworks: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/subnetworks}
   *
   * @param {object=} options - Subnetwork search options.
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
   * @param {number} options.maxResults - Maximum number of subnetworks to return.
   * @param {string} options.pageToken - A previously-returned page token
   *     representing part of the larger set of results to view.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Subnetwork[]} callback.subnetworks - Subnetwork
   *     objects from this region.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const region = compute.region('us-central1');
   *
   * region.getSubnetworks(function(err, subnetworks) {
   *   // `subnetworks` is an array of `Subnetwork` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, subnetworks, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     region.getSubnetworks(nextQuery, callback);
   *   }
   * }
   *
   * region.getSubnetworks({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * region.getSubnetworks().then(function(data) {
   *   const subnetworks = data[0];
   * });
   */
  getSubnetworks(
    options: GetResourcesOptions,
    callback: GetResourcesCallback<Subnetwork>
  ): void;
  getSubnetworks(callback: GetResourcesCallback<Subnetwork>): void;
  getSubnetworks(
    options?: GetResourcesOptions
  ): GetResourcesPromise<Subnetwork>;
  getSubnetworks(
    options?: GetResourcesOptions | GetResourcesCallback<Subnetwork>,
    callback?: GetResourcesCallback<Subnetwork>
  ): void | GetResourcesPromise<Subnetwork> {
    const [opts, cb] = util.maybeOptionsOrCallback<
      GetResourcesOptions,
      GetResourcesCallback<Subnetwork>
    >(options, callback);
    this.request({uri: '/subnetworks', qs: opts}, (err, resp) => {
      if (err) {
        cb(err, null, null, resp);
        return;
      }
      let nextQuery = null;
      if (resp.nextPageToken) {
        nextQuery = Object.assign({}, opts, {pageToken: resp.nextPageToken});
      }
      const subnetworks = ((resp.items as Metadata[]) || []).map(subnetwork => {
        const subnetworkInstance = this.subnetwork(subnetwork.name);
        subnetworkInstance.metadata = subnetwork;
        return subnetworkInstance;
      });
      cb(null, subnetworks, nextQuery, resp);
    });
  }
  /**
   * Get a reference to a Google Compute Engine region operation.
   *
   * @see [Region Operation Overview]{@link https://cloud.google.com/compute/docs/reference/v1/regionOperations}
   *
   * @param {string} name - Name of the existing operation.
   * @returns {Operation}
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const region = compute.region('us-central1');
   *
   * const operation = region.operation('operation-name');
   */
  operation(name: string): Operation {
    return new Operation(this, name);
  }
  /**
   * Get a reference to a Google Compute Engine forwarding rule in this region.
   *
   * @param {string} name - Name of the rule.
   * @returns {Rule}
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const region = compute.region('us-central1');
   *
   * const rule = region.rule('rule-name');
   */
  rule(name: string): Rule {
    return new Rule(this, name);
  }
  /**
   * Get a reference to a Google Compute Engine subnetwork in this region.
   *
   * @see [Subnetworks Overview]{@link https://cloud.google.com/compute/docs/subnetworks}
   *
   * @param {string} name - Name of the subnetwork.
   * @returns {Subnetwork}
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const region = compute.region('us-central1');
   *
   * const subnetwork = region.subnetwork('subnetwork-name');
   */
  subnetwork(name: string): Subnetwork {
    return new Subnetwork(this, name);
  }
}

/*! Developer Documentation
 *
 * These methods can be auto-paginated.
 */
paginator.extend(Region, [
  'getAddresses',
  'getOperations',
  'getRules',
  'getSubnetworks',
]);

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(Region, {exclude: ['address', 'operation', 'rule', 'subnetwork']});
