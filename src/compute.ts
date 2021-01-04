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

import arrify = require('arrify');
import * as common from '@google-cloud/common';
import * as extend from 'extend';
import * as is from 'is';
import {promisifyAll} from '@google-cloud/promisify';
import {paginator} from '@google-cloud/paginator';

import type {
  GetResourcesCallback,
  GetResourcesOptions,
  GetResourcesPromise,
  GetResourcesStream,
  MetadataCallback,
} from './interfaces';
import type {CreateResourceCallback, CreateResourcePromise} from './operation';

import type {Disk} from './disk';
import {Firewall, FirewallRule} from './firewall';
import type {CreateFirewallOptions} from './firewall';
import {HealthCheck} from './health-check';
import type {
  CreateHealthCheckOptions,
  GetHealthChecksOptions,
} from './health-check';
import type {CreateImageOptions} from './image';
import {Network} from './network';
import type {CreateNetworkOptions} from './network';
import {Operation} from './operation';
import {Project} from './project';
import {Region} from './region';
import {Rule} from './rule';
import type {CreateRuleOptions} from './rule';
import {Service} from './service';
import type {CreateServiceOptions} from './service';
import {Snapshot} from './snapshot';
import {Zone} from './zone';
import {Image} from './image';
import type {Address} from './address';
import type {Autoscaler} from './autoscaler';
import type {InstanceGroup} from './instance-group';
import type {MachineType} from './machine-type';
import type {Subnetwork} from './subnetwork';
import type {VM} from './vm';

/**
 * @typedef {object} ClientConfig
 * @property {string} [projectId] The project ID from the Google Developer's
 *     Console, e.g. 'grape-spaceship-123'. We will also check the environment
 *     variable `GCLOUD_PROJECT` for your project ID. If your app is running in
 *     an environment which supports {@link https://cloud.google.com/docs/authentication/production#providing_credentials_to_your_application Application Default Credentials},
 *     your project ID will be detected automatically.
 * @property {string} [keyFilename] Full path to the a .json, .pem, or .p12 key
 *     downloaded from the Google Developers Console. If you provide a path to a
 *     JSON file, the `projectId` option above is not necessary. NOTE: .pem and
 *     .p12 require you to specify the `email` option as well.
 * @property {string} [email] Account email address. Required when using a .pem
 *     or .p12 keyFilename.
 * @property {object} [credentials] Credentials object.
 * @property {string} [credentials.client_email]
 * @property {string} [credentials.private_key]
 * @property {boolean} [autoRetry=true] Automatically retry requests if the
 *     response is related to rate limits or certain intermittent server errors.
 *     We will exponentially backoff subsequent requests by default.
 * @property {number} [maxRetries=3] Maximum number of automatic retries
 *     attempted before returning the error.
 * @property {number} [pollIntervalMs=500] Poll interval for long running
 *    operations.
 * @property {Constructor} [promise] Custom promise module to use instead of
 *     native Promises.
 * @property {string} [apiEndpoint] The API endpoint of the service used to make requests. Defaults to `compute.googleapis.com`
 */
export interface ClientConfig {
  projectId?: string;
  keyFilename?: string;
  email?: string;
  credentials?: {client_email?: string; private_key?: string};
  autoRetry?: boolean;
  maxRetries?: number;
  pollIntervalMs?: number;
  promise?: PromiseConstructor;
  apiEndpoint?: string;
}

/**
 * @see [What is Google Compute Engine?]{@link https://cloud.google.com/compute/docs}
 *
 * @class
 *
 * @param {ClientConfig} [options] Configuration options.
 *
 * @example <caption>Create a client that uses Application Default Credentials (ADC)</caption>
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 *
 * @example <caption>Create a client with explicit credentials</caption>
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute({
 *   projectId: 'your-project-id',
 *   keyFilename: '/path/to/keyfile.json'
 * });
 */
export class Compute extends common.Service {
  pollIntervalMs?: number;
  /**
   * Get a list of {@link Address} objects as a readable object stream.
   *
   * @param {object=} options - Configuration object. See
   *     {@link Compute#getAddresses} for a complete list of options.
   * @returns {stream}
   *
   * @example
   * gce.getAddressesStream()
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
   * gce.getAddressesStream()
   *   .on('data', function(address) {
   *     this.end();
   *   });
   */
  getAddressesStream: GetResourcesStream<Address>;
  /**
   * Get a list of {@link Autoscaler} objects as a readable object
   * stream.
   *
   * @param {object=} query - Configuration object. See
   *     {@link Compute#getAutoscalers} for a complete list of options.
   * @returns {stream}
   *
   * @example
   * gce.getAutoscalersStream()
   *   .on('error', console.error)
   *   .on('data', function(autoscaler) {
   *     // `autoscaler` is an `Autoscaler` object.
   *   })
   *   .on('end', function() {
   *     // All addresses retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * gce.getAutoscalersStream()
   *   .on('data', function(address) {
   *     this.end();
   *   });
   */
  getAutoscalersStream: GetResourcesStream<Autoscaler>;
  /**
   * Get a list of {@link Disk} objects as a readable object stream.
   *
   * @method Compute#getDisksStream
   * @param {object=} options - Configuration object. See
   *     {@link Compute#getDisks} for a complete list of options.
   * @returns {stream}
   *
   * @example
   * gce.getDisksStream()
   *   .on('error', console.error)
   *   .on('data', function(disk) {
   *     // `disk` is a `Disk` object.
   *   })
   *   .on('end', function() {
   *     // All disks retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * gce.getDisksStream()
   *   .on('data', function(disk) {
   *     this.end();
   *   });
   */
  getDisksStream: GetResourcesStream<Disk>;
  /**
   * Get a list of {@link InstanceGroup} objects as a readable object
   * stream.
   *
   * @method Compute#getInstanceGroupsStream
   * @param {object=} options - Configuration object. See
   *     {@link Compute#getInstanceGroups} for a complete list of options.
   * @returns {stream}
   *
   * @example
   * gce.getInstanceGroupsStream()
   *   .on('error', console.error)
   *   .on('data', function(instanceGroup) {
   *     // `instanceGroup` is an `InstanceGroup` object.
   *   })
   *   .on('end', function() {
   *     // All instance groups retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * gce.getInstanceGroupsStream()
   *   .on('data', function(instanceGroup) {
   *     this.end();
   *   });
   */
  getInstanceGroupsStream: GetResourcesStream<InstanceGroup>;
  /**
   * Get a list of {@link Firewall} objects as a readable object stream.
   *
   * @method Compute#getFirewallsStream
   * @param {object=} query - Configuration object. See
   *     {@link Compute#getFirewalls} for a complete list of options.
   * @returns {stream}
   *
   * @example
   * gce.getFirewallsStream()
   *   .on('error', console.error)
   *   .on('data', function(firewall) {
   *     // `firewall` is a `Firewall` object.
   *   })
   *   .on('end', function() {
   *     // All firewalls retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * gce.getFirewallsStream()
   *   .on('data', function(firewall) {
   *     this.end();
   *   });
   */
  getFirewallsStream: GetResourcesStream<Firewall>;
  /**
   * Get a list of {@link HealthCheck} objects as a readable object
   * stream.
   *
   * @method Compute#getHealthChecksStream
   * @param {object=} options - Configuration object. See
   *     {@link Compute#getHealthChecks} for a complete list of options.
   * @returns {stream}
   *
   * @example
   * gce.getHealthChecksStream()
   *   .on('error', console.error)
   *   .on('data', function(healthCheck) {
   *     // `healthCheck` is a `HealthCheck` object.
   *   })
   *   .on('end', function() {
   *     // All health checks retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * gce.getHealthChecksStream()
   *   .on('data', function(healthCheck) {
   *     this.end();
   *   });
   */
  getHealthChecksStream: GetResourcesStream<
    HealthCheck,
    GetHealthChecksOptions
  >;
  /**
   * Get a list of {@link Image} objects as a readable object stream.
   *
   * @method Compute#getImagesStream
   * @param {object=} query - Configuration object. See {@link Compute#getImages}
   *     for a complete list of options.
   * @returns {stream}
   *
   * @example
   * gce.getImagesStream()
   *   .on('error', console.error)
   *   .on('data', function(image) {
   *     // `image` is an `Image` object.
   *   })
   *   .on('end', function() {
   *     // All images retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * gce.getImagesStream()
   *   .on('data', function(image) {
   *     this.end();
   *   });
   */
  getImagesStream: GetResourcesStream<Image>;
  /**
   * Get a list of {@link MachineType} objects in this project as a
   * readable object stream.
   *
   * @method Compute#getMachineTypesStream
   * @param {object=} options - Configuration object. See
   *     {@link Compute#getMachineTypes} for a complete list of options.
   * @returns {stream}
   *
   * @example
   * gce.getMachineTypesStream()
   *   .on('error', console.error)
   *   .on('data', function(machineType) {
   *     // `machineType` is a `MachineType` object.
   *   })
   *   .on('end', function() {
   *     // All machine types retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * gce.getMachineTypesStream()
   *   .on('data', function(machineType) {
   *     this.end();
   *   });
   */
  getMachineTypesStream: GetResourcesStream<MachineType>;
  /**
   * Get a list of {@link Network} objects as a readable object stream.
   *
   * @method Compute#getNetworksStream
   * @param {object=} options - Configuration object. See
   *     {@link Compute#getNetworks} for a complete list of options.
   * @returns {stream}
   *
   * @example
   * gce.getNetworksStream()
   *   .on('error', console.error)
   *   .on('data', function(network) {
   *     // `network` is a `Network` object.
   *   })
   *   .on('end', function() {
   *     // All networks retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * gce.getNetworksStream()
   *   .on('data', function(network) {
   *     this.end();
   *   });
   */
  getNetworksStream: GetResourcesStream<Network>;
  /**
   * Get a list of global {@link Operation} objects as a readable object
   * stream.
   *
   * @method Compute#getOperationsStream
   * @param {object=} options - Configuration object. See
   *     {@link Compute#getOperations} for a complete list of options.
   * @returns {stream}
   *
   * @example
   * gce.getOperationsStream()
   *   .on('error', console.error)
   *   .on('data', function(operation) {
   *     // `operation` is a `Operation` object.
   *   })
   *   .on('end', function() {
   *     // All operations retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * gce.getOperationsStream()
   *   .on('data', function(operation) {
   *     this.end();
   *   });
   */
  getOperationsStream: GetResourcesStream<Operation>;
  /**
   * Return the {@link Region} objects available to your project as a
   * readable object stream.
   *
   * @method Compute#getRegionsStream
   * @param {object=} options - Configuration object. See
   *     {@link Compute#getRegions} for a complete list of options.
   * @returns {stream}
   *
   * @example
   * gce.getRegionsStream()
   *   .on('error', console.error)
   *   .on('data', function(region) {
   *     // `region` is a `Region` object.
   *   })
   *   .on('end', function() {
   *     // All regions retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * gce.getRegionsStream()
   *   .on('data', function(region) {
   *     this.end();
   *   });
   */
  getRegionsStream: GetResourcesStream<Region>;
  /**
   * Get a list of {@link Rule} objects as a readable object stream.
   *
   * @method Compute#getRulesStream
   * @param {object=} options - Configuration object. See
   *     {@link Compute#getRules} for a complete list of options.
   * @returns {stream}
   *
   * @example
   * gce.getRulesStream()
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
   * gce.getRulesStream()
   *   .on('data', function(rule) {
   *     this.end();
   *   });
   */
  getRulesStream: GetResourcesStream<Rule>;
  /**
   * Get a list of {@link Service} objects as a readable object stream.
   *
   * @method Compute#getServicesStream
   * @param {object=} options - Configuration object. See
   *     {@link Compute#getServices} for a complete list of options.
   * @returns {stream}
   *
   * @example
   * gce.getServicesStream()
   *   .on('error', console.error)
   *   .on('data', function(service) {
   *     // `service` is a `Service` object.
   *   })
   *   .on('end', function() {
   *     // All services retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * gce.getServicesStream()
   *   .on('data', function(service) {
   *     this.end();
   *   });
   */
  getServicesStream: GetResourcesStream<Service>;
  /**
   * Get a list of {@link Snapshot} objects as a readable object stream.
   *
   * @method Compute#getSnapshotsStream
   * @param {object=} options - Configuration object. See
   *     {@link Compute#getSnapshots} for a complete list of options.
   * @returns {stream}
   *
   * @example
   * gce.getSnapshotsStream()
   *   .on('error', console.error)
   *   .on('data', function(snapshot) {
   *     // `snapshot` is a `Snapshot` object.
   *   })
   *   .on('end', function() {
   *     // All snapshots retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * gce.getSnapshotsStream()
   *   .on('data', function(snapshot) {
   *     this.end();
   *   });
   */
  getSnapshotsStream: GetResourcesStream<Snapshot>;
  /**
   * Get a list of {@link Subnetwork} objects in this project as a
   * readable object stream.
   *
   * @method Compute#getSubnetworksStream
   * @param {object=} options - Configuration object. See
   *     {@link Compute#getSubnetworks} for a complete list of options.
   * @returns {stream}
   *
   * @example
   * gce.getSubnetworksStream()
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
   * gce.getSubnetworksStream()
   *   .on('data', function(subnetwork) {
   *     this.end();
   *   });
   */
  getSubnetworksStream: GetResourcesStream<Subnetwork>;
  /**
   * Get a list of {@link VM} instances as a readable object stream.
   *
   * @method Compute#getVMsStream
   * @param {object=} options - Configuration object. See
   *     {@link Compute#getVMs} for a complete list of options.
   * @returns {stream}
   *
   * @example
   * gce.getVMsStream()
   *   .on('error', console.error)
   *   .on('data', function(vm) {
   *     // `vm` is a `VM` object.
   *   })
   *   .on('end', function() {
   *     // All vms retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * gce.getVMsStream()
   *   .on('data', function(vm) {
   *     this.end();
   *   });
   */
  getVMsStream: GetResourcesStream<VM>;
  /**
   * Return the {@link Zone} objects available to your project as a
   * readable object stream.
   *
   * @method Compute#getZonesStream
   * @param {object=} options - Configuration object. See
   *     {@link Compute#getZones} for a complete list of options.
   * @returns {stream}
   *
   * @example
   * gce.getZonesStream()
   *   .on('error', console.error)
   *   .on('data', function(zone) {
   *     // `zone` is a `Zone` object.
   *   })
   *   .on('end', function() {
   *     // All zones retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * gce.getZonesStream()
   *   .on('data', function(zone) {
   *     this.end();
   *   });
   */
  getZonesStream: GetResourcesStream<Zone>;
  constructor(options: ClientConfig = {}) {
    options = extend(
      true,
      {
        apiEndpoint: 'compute.googleapis.com',
      },
      options
    );
    const config = {
      apiEndpoint: options.apiEndpoint!,
      baseUrl: `https://${options.apiEndpoint}/compute/v1`,
      scopes: ['https://www.googleapis.com/auth/compute'],
      packageJson: require('../../package.json'),
    };
    super(config, options);
    this.pollIntervalMs = options.pollIntervalMs;
    this.getAddressesStream = paginator.streamify('getAddresses');
    this.getAutoscalersStream = paginator.streamify('getAutoscalers');
    this.getDisksStream = paginator.streamify('getDisks');
    this.getInstanceGroupsStream = paginator.streamify('getInstanceGroups');
    this.getFirewallsStream = paginator.streamify('getFirewalls');
    this.getHealthChecksStream = paginator.streamify('getHealthChecks');
    this.getImagesStream = paginator.streamify('getImages');
    this.getMachineTypesStream = paginator.streamify('getMachineTypes');
    this.getNetworksStream = paginator.streamify('getNetworks');
    this.getOperationsStream = paginator.streamify('getOperations');
    this.getRegionsStream = paginator.streamify('getRegions');
    this.getRulesStream = paginator.streamify('getRules');
    this.getServicesStream = paginator.streamify('getServices');
    this.getSnapshotsStream = paginator.streamify('getSnapshots');
    this.getSubnetworksStream = paginator.streamify('getSubnetworks');
    this.getVMsStream = paginator.streamify('getVMs');
    this.getZonesStream = paginator.streamify('getZones');
  }
  createFirewall(
    name: string,
    config: CreateFirewallOptions
  ): CreateResourcePromise<Firewall>;
  createFirewall(
    name: string,
    config: CreateFirewallOptions,
    callback: CreateResourceCallback<Firewall>
  ): void;
  /**
   * Create a firewall.
   *
   * @see [Firewalls Overview]{@link https://cloud.google.com/compute/docs/networking#firewalls}
   * @see [Firewalls: insert API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/firewalls/insert}
   *
   * @throws {Error} if a name is not provided.
   * @throws {Error} if a config object is not provided.
   *
   * @param {string} name - Name of the firewall.
   * @param {object} config - See a
   *     [Firewall resource](https://cloud.google.com/compute/docs/reference/v1/firewalls#resource).
   * @param {object} config.protocols - A map of protocol to port range. The keys
   *     of the object refer to a protocol (e.g. `tcp`, `udp`) and the value for
   *     the key are the ports/port-ranges that are allowed to make a connection.
   *     If a `true` value, that means all ports on that protocol will be opened.
   *     If `false`, all traffic on that protocol will be blocked.
   * @param {string[]} config.ranges - The IP address blocks that this rule
   *     applies to, expressed in
   *     [CIDR](http://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing)
   *     format.
   * @param {string[]} config.tags - Instance tags which this rule applies to.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Firewall} callback.firewall - The created Firewall
   *     object.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * var config = {
   *   protocols: {
   *     tcp: [3000],
   *     udp: [] // An empty array means all ports are allowed.
   *   },
   *
   *   ranges: ['0.0.0.0/0']
   * };
   *
   * function callback(err, firewall, operation, apiResponse) {
   *   // `firewall` is a Firewall object.
   *
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * }
   *
   * gce.createFirewall('new-firewall-name', config, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * gce.createFirewall('new-firewall-name', config).then(function(data) {
   *   var firewall = data[0];
   *   var operation = data[1];
   *   var apiResponse = data[2];
   * });
   */
  createFirewall(
    name: string,
    config: CreateFirewallOptions,
    callback?: CreateResourceCallback<Firewall>
  ): void | CreateResourcePromise<Firewall> {
    if (!is.string(name)) {
      throw new Error('A firewall name must be provided.');
    }
    if (!is.object(config)) {
      throw new Error('A firewall configuration object must be provided.');
    }
    const body = Object.assign({}, config, {name: name});
    if (body.protocols) {
      body.allowed = arrify(body.allowed);
      for (const protocol in body.protocols) {
        const allowedConfig: FirewallRule = {
          IPProtocol: protocol,
        };
        const ports = body.protocols[protocol];
        if (ports === false || (ports as string[]).length === 0) {
          continue;
        }
        // If the port is `true`, open up all ports on this protocol.
        allowedConfig.ports = ports === true ? [] : arrify(ports);
        body.allowed.push(allowedConfig);
      }
      delete body.protocols;
    }
    if (body.ranges) {
      body.sourceRanges = arrify(body.ranges);
      delete body.ranges;
    }
    if (body.tags) {
      body.sourceTags = arrify(body.tags);
      delete body.tags;
    }
    this.request(
      {method: 'POST', uri: '/global/firewalls', json: body},
      (err, resp) => {
        if (err) {
          callback!(err, null, null, resp);
          return;
        }
        const firewall = this.firewall(name);
        const operation = this.operation(resp.name);
        operation.metadata = resp;
        callback!(null, firewall, operation, resp);
      }
    );
  }
  createHealthCheck(
    name: string,
    options?: CreateHealthCheckOptions
  ): CreateResourcePromise<HealthCheck>;
  createHealthCheck(
    name: string,
    callback: CreateResourceCallback<HealthCheck>
  ): void;
  createHealthCheck(
    name: string,
    options: CreateHealthCheckOptions,
    callback: CreateResourceCallback<HealthCheck>
  ): void;
  /**
   * Create an HTTP or HTTPS health check.
   *
   * @see [Health Checks Overview]{@link https://cloud.google.com/compute/docs/load-balancing/health-checks}
   * @see [HttpHealthCheck: insert API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/httpHealthChecks/insert}
   * @see [HttpsHealthCheck: insert API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/httpsHealthChecks/insert}
   *
   * @param {string} name - Name of the HTTP or HTTPS health check to create.
   * @param {object=} options - See a
   *     [HttpHealthCheck resource](https://cloud.google.com/compute/docs/reference/v1/httpHealthChecks#resource)
   *     and [HttpsHealthCheck resource](https://cloud.google.com/compute/docs/reference/v1/httpsHealthChecks#resource).
   * @param {boolean} options.https - Create an HTTPs health check. Default:
   *     `false`.
   * @param {number} options.interval - How often (in seconds) to send a health
   *     check. The default value is 5 seconds. (Alias for
   *     `options.checkIntervalSec`)
   * @param {number} options.timeout - How long (in seconds) to wait before
   *     claiming failure. The default value is 5 seconds. It is invalid for
   *     this value to be greater than checkIntervalSec. (Alias for
   *     `options.timeoutSec`)
   * @param {function=} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {HealthCheck} callback.healthCheck - The created
   *     HealthCheck object.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * function callback(err, healthCheck, operation, apiResponse) {
   *   // `healthCheck` is a HealthCheck object.
   *
   *   // `operation` is an Operation object that can be used to check the status
   *   // of network creation.
   * }
   *
   * gce.createHealthCheck('new-health-check-name', callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * gce.createHealthCheck('new-health-check-name').then(function(data) {
   *   var healthCheck = data[0];
   *   var operation = data[1];
   *   var apiResponse = data[2];
   * });
   */
  createHealthCheck(
    name: string,
    options?: CreateHealthCheckOptions | CreateResourceCallback<HealthCheck>,
    callback?: CreateResourceCallback<HealthCheck>
  ): void | CreateResourcePromise<HealthCheck> {
    const [opts, cb] = common.util.maybeOptionsOrCallback<
      CreateHealthCheckOptions,
      CreateResourceCallback<HealthCheck>
    >(options, callback);
    if (!is.string(name)) {
      throw new Error('A health check name must be provided.');
    }
    const body = Object.assign({}, opts, {
      name: name,
    });
    const https = opts.https;
    delete body.https;
    if (body.interval) {
      body.checkIntervalSec = body.interval;
      delete body.interval;
    }
    if (body.timeout) {
      body.timeoutSec = body.timeout;
      delete body.timeout;
    }
    this.request(
      {
        method: 'POST',
        uri: '/global/' + (https ? 'httpsHealthChecks' : 'httpHealthChecks'),
        json: body,
      },
      (err, resp) => {
        if (err) {
          cb(err, null, null, resp);
          return;
        }
        const healthCheck = this.healthCheck(name, {https: https});
        const operation = this.operation(resp.name);
        operation.metadata = resp;
        cb(null, healthCheck, operation, resp);
      }
    );
  }
  createImage(
    name: string,
    disk: Disk,
    options?: CreateImageOptions
  ): CreateResourcePromise<Image>;
  createImage(
    name: string,
    disk: Disk,
    callback: CreateResourceCallback<Image>
  ): void;
  createImage(
    name: string,
    disk: Disk,
    options: CreateImageOptions,
    callback: CreateResourceCallback<Image>
  ): void;
  /**
   * Create an image from a disk.
   *
   * @see [Images: insert API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/images/insert}
   *
   * @param {string} name - The name of the target image.
   * @param {Disk} disk - The source disk to create the image from.
   * @param {object} [options] - See the
   *     [Images: insert API documentation](https://cloud.google.com/compute/docs/reference/v1/images/insert).
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Operation} callback.operation - An operation object that can be used
   *     to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   * const disk = zone.disk('disk1');
   *
   * compute.createImage('new-image', disk, function(err, operation, apiResponse) {
   *   // `operation` is an Operation object that can be used to check the status
   *   // of network creation.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * compute.createImage('new-image', disk).then(function(data) {
   *   var operation = data[0];
   *   var apiResponse = data[1];
   * });
   */
  createImage(
    name: string,
    disk: Disk,
    options?: CreateImageOptions | CreateResourceCallback<Image>,
    callback?: CreateResourceCallback<Image>
  ): void | CreateResourcePromise<Image> {
    if (!common.util.isCustomType(disk, 'Disk')) {
      throw new Error('A Disk object is required.');
    }
    const [opts, cb] = common.util.maybeOptionsOrCallback<
      CreateImageOptions,
      CreateResourceCallback<Image>
    >(options, callback);
    const body = Object.assign(
      {name: name, sourceDisk: `zones/${disk.zone.name}/disks/${disk.name}`},
      opts
    );
    this.request(
      {method: 'POST', uri: '/global/images', json: body},
      (err, resp) => {
        if (err) {
          cb(err, null, resp);
          return;
        }
        const image = this.image(name);
        const operation = this.operation(resp.name);
        operation.metadata = resp;
        cb(null, image, operation, resp);
      }
    );
  }
  createNetwork(
    name: string,
    config: CreateNetworkOptions
  ): CreateResourcePromise<Network>;
  createNetwork(
    name: string,
    config: CreateNetworkOptions,
    callback: CreateResourceCallback<Network>
  ): void;
  /**
   * Create a network.
   *
   * @see [Networks Overview]{@link https://cloud.google.com/compute/docs/networking#networks}
   * @see [Networks: insert API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/networks/insert}
   *
   * @param {string} name - Name of the network.
   * @param {object} config - See a
   *     [Network resource](https://cloud.google.com/compute/docs/reference/v1/networks#resource).
   * @param {string} config.gateway - A gateway address for default routing to
   *     other networks. (Alias for `config.gatewayIPv4`)
   * @param {string} config.range -
   *     [CIDR](http://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing) range
   *     of addresses that are legal on this network. (Alias for
   *     `config.IPv4Range`)
   * @param {function=} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Network} callback.network - The created Network
   *     object.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * var config = {
   *   range: '10.240.0.0/16'
   * };
   *
   * function callback(err, network, operation, apiResponse) {
   *   // `network` is a Network object.
   *
   *   // `operation` is an Operation object that can be used to check the status
   *   // of network creation.
   * }
   *
   * gce.createNetwork('new-network', config, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * gce.createNetwork('new-network', config).then(function(data) {
   *   var network = data[0];
   *   var operation = data[1];
   *   var apiResponse = data[2];
   * });
   */
  createNetwork(
    name: string,
    config: CreateNetworkOptions,
    callback?: CreateResourceCallback<Network>
  ): void | CreateResourcePromise<Network> {
    const body = Object.assign({}, config, {name: name});
    if (body.range) {
      body.IPv4Range = body.range;
      delete body.range;
    }
    if (body.gateway) {
      body.gatewayIPv4 = body.gateway;
      delete body.gateway;
    }
    this.request(
      {method: 'POST', uri: '/global/networks', json: body},
      (err, resp) => {
        if (err) {
          callback!(err, null, null, resp);
          return;
        }
        const network = this.network(name);
        const operation = this.operation(resp.name);
        operation.metadata = resp;
        callback!(null, network, operation, resp);
      }
    );
  }
  createRule(
    name: string,
    config: CreateRuleOptions
  ): CreateResourcePromise<Rule>;
  createRule(
    name: string,
    config: CreateRuleOptions,
    callback: CreateResourceCallback<Rule>
  ): void;
  /**
   * Create a global forwarding rule.
   *
   * @see [GlobalForwardingRule Resource]{@link https://cloud.google.com/compute/docs/reference/v1/globalForwardingRules#resource}
   * @see [GlobalForwardingRules: insert API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/globalForwardingRules/insert}
   *
   * @param {string} name - Name of the rule.
   * @param {object} config - See a
   *     [GlobalForwardingRule resource](https://cloud.google.com/compute/docs/reference/v1/globalForwardingRules#resource).
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
   *     resource to receive the matched traffic. This target must be a global
   *     [`TargetHttpProxy` or `TargetHttpsProxy` resource](https://cloud.google.com/compute/docs/load-balancing/http/target-proxies).
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Rule} callback.rule - The created Rule object.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * var name = 'new-rule-name';
   *
   * var config = {
   *   target: 'global/targetHttpProxies/my-proxy',
   *   range: '8080-8089'
   * };
   *
   * gce.createRule(name, config, function (err, rule, operation, apiResponse) {
   *   // `rule` is a Rule object.
   *
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * gce.createRule(name, config).then(function(data) {
   *   var rule = data[0];
   *   var operation = data[1];
   *   var apiResponse = data[2];
   * });
   */
  createRule(
    name: string,
    config: CreateRuleOptions,
    callback?: CreateResourceCallback<Rule>
  ): void | CreateResourcePromise<Rule> {
    const body = Object.assign({}, config, {name: name});
    if (body.ip) {
      body.IPAddress = body.ip;
      delete body.ip;
    }
    if (body.protocol) {
      body.IPProtocol = body.protocol;
      delete body.protocol;
    }
    if (body.range) {
      body.portRange = body.range;
      delete body.range;
    }
    this.request(
      {method: 'POST', uri: '/global/forwardingRules', json: body},
      (err, resp) => {
        if (err) {
          callback!(err, null, null, resp);
          return;
        }
        const rule = this.rule(name);
        const operation = this.operation(resp.name);
        operation.metadata = resp;
        callback!(null, rule, operation, resp);
      }
    );
  }
  createService(
    name: string,
    config: CreateServiceOptions
  ): CreateResourcePromise<Service>;
  createService(
    name: string,
    config: CreateServiceOptions,
    callback: CreateResourceCallback<Service>
  ): void;
  /**
   * Create a backend service.
   *
   * @see [Backend Services Overview]{@link https://cloud.google.com/compute/docs/load-balancing/http/backend-service}
   * @see [BackendServices: insert API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/backendServices/insert}
   *
   * @param {string} name - Name of the backend service.
   * @param {object} config - See a
   *     [BackendService resource](https://cloud.google.com/compute/docs/reference/v1/backendServices#resource).
   * @param {function=} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Service} callback.service - The created Service
   *     object.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * var config = {
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
   * function callback(err, service, operation, apiResponse) {
   *   // `service` is a Service object.
   *
   *   // `operation` is an Operation object that can be used to check the status
   *   // of network creation.
   * }
   *
   * gce.createService('new-service', config, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * gce.createService('new-service', config).then(function(data) {
   *   var service = data[0];
   *   var operation = data[1];
   *   var apiResponse = data[2];
   * });
   */
  createService(
    name: string,
    config: CreateServiceOptions,
    callback?: CreateResourceCallback<Service>
  ): void | CreateResourcePromise<Service> {
    const body = Object.assign({}, config, {name: name});
    this.request(
      {method: 'POST', uri: '/global/backendServices', json: body},
      (err, resp) => {
        if (err) {
          callback!(err, null, null, resp);
          return;
        }
        const service = this.service(name);
        const operation = this.operation(resp.name);
        operation.metadata = resp;
        callback!(null, service, operation, resp);
      }
    );
  }
  /**
   * Get a reference to a Google Compute Engine firewall.
   *
   * See {@link Network#firewall} to get a Firewall object for a specific
   * network.
   *
   * @see [Firewalls Overview]{@link https://cloud.google.com/compute/docs/networking#firewalls}
   *
   * @param {string} name - Name of the firewall.
   * @returns {Firewall}
   *
   * @example
   * var firewall = gce.firewall('firewall-name');
   */
  firewall(name: string): Firewall {
    return new Firewall(this, name);
  }
  getAddresses(options?: GetResourcesOptions): GetResourcesPromise<Address>;
  getAddresses(callback: GetResourcesCallback<Address>): void;
  getAddresses(
    options: GetResourcesOptions,
    callback: GetResourcesCallback<Address>
  ): void;
  /**
   * Get a list of addresses. For a detailed description of method's options see
   * [API reference](https://goo.gl/r9XmXJ).
   *
   * @see [Instances and Networks]{@link https://cloud.google.com/compute/docs/instances-and-network}
   * @see [Addresses: aggregatedList API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/addresses/aggregatedList}
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
   *     your project.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * gce.getAddresses(function(err, addresses) {
   *   // addresses is an array of `Address` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, addresses, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     gce.getAddresses(nextQuery, callback);
   *   }
   * }
   *
   * gce.getAddresses({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * gce.getAddresses().then(function(data) {
   *   var addresses = data[0];
   * });
   */
  getAddresses(
    options?: GetResourcesOptions | GetResourcesCallback<Address>,
    callback?: GetResourcesCallback<Address>
  ): void | GetResourcesPromise<Address> {
    const [opts, cb] = common.util.maybeOptionsOrCallback<
      GetResourcesOptions,
      GetResourcesCallback<Address>
    >(options, callback);
    this.request({uri: '/aggregated/addresses', qs: opts}, (err, resp) => {
      if (err) {
        cb(err, null, null, resp);
        return;
      }
      let nextQuery = null;
      if (resp.nextPageToken) {
        nextQuery = Object.assign({}, opts, {pageToken: resp.nextPageToken});
      }
      const regions = resp.items || {};
      const addresses = Object.keys(regions).reduce<Address[]>(
        (acc, regionName) => {
          const region = this.region(regionName.replace('regions/', ''));
          const regionAddresses: common.Metadata[] =
            regions[regionName].addresses || [];
          regionAddresses.forEach(address => {
            const addressInstance = region.address(address.name);
            addressInstance.metadata = address;
            acc.push(addressInstance);
          });
          return acc;
        },
        []
      );
      cb(null, addresses, nextQuery, resp);
    });
  }
  getAutoscalers(
    options?: GetResourcesOptions
  ): GetResourcesPromise<Autoscaler>;
  getAutoscalers(callback: GetResourcesCallback<Autoscaler>): void;
  getAutoscalers(
    options: GetResourcesOptions,
    callback: GetResourcesCallback<Autoscaler>
  ): void;
  /**
   * Get a list of autoscalers. For a detailed description of this method's
   * options, see the [API reference](https://cloud.google.com/compute/docs/reference/v1/autoscalers/aggregatedList).
   *
   * @see [Managing Autoscalers]{@link https://cloud.google.com/compute/docs/autoscaler/managing-autoscalers}
   * @see [Understanding Autoscaler Decisions]{@link https://cloud.google.com/compute/docs/autoscaler/understanding-autoscaler-decisions}
   * @see [Autoscalers: aggregatedList API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/autoscalers/aggregatedList}
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
   * @param {Autoscaler[]} callback.autoscalers - Autoscaler
   *     objects from your project.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * gce.getAutoscalers(function(err, autoscalers) {
   *   // autoscalers is an array of `Autoscaler` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, autoscalers, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     gce.getAutoscalers(nextQuery, callback);
   *   }
   * }
   *
   * gce.getAutoscalers({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * gce.getAutoscalers().then(function(data) {
   *   var autoscalers = data[0];
   * });
   */
  getAutoscalers(
    options?: GetResourcesOptions | GetResourcesCallback<Autoscaler>,
    callback?: GetResourcesCallback<Autoscaler>
  ): void | GetResourcesPromise<Autoscaler> {
    const [opts, cb] = common.util.maybeOptionsOrCallback<
      GetResourcesOptions,
      GetResourcesCallback<Autoscaler>
    >(options, callback);
    this.request({uri: '/aggregated/autoscalers', qs: opts}, (err, resp) => {
      if (err) {
        cb(err, null, null, resp);
        return;
      }
      let nextQuery = null;
      if (resp.nextPageToken) {
        nextQuery = Object.assign({}, opts, {pageToken: resp.nextPageToken});
      }
      const zones = resp.items || {};
      const autoscalers = Object.keys(zones).reduce<Autoscaler[]>(
        (acc, zoneName) => {
          if (zoneName.indexOf('zones/') !== 0) {
            return acc;
          }
          const zone = this.zone(zoneName.replace('zones/', ''));
          const zoneAutoscalers: common.Metadata[] =
            zones[zoneName].autoscalers || [];
          zoneAutoscalers.forEach(autoscaler => {
            const autoscalerInstance = zone.autoscaler(autoscaler.name);
            autoscalerInstance.metadata = autoscaler;
            acc.push(autoscalerInstance);
          });
          return acc;
        },
        []
      );
      cb(null, autoscalers, nextQuery, resp);
    });
  }
  getDisks(options?: GetResourcesOptions): GetResourcesPromise<Disk>;
  getDisks(callback: GetResourcesCallback<Disk>): void;
  getDisks(
    options: GetResourcesOptions,
    callback: GetResourcesCallback<Disk>
  ): void;
  /**
   * Get a list of disks.
   *
   * @see [Disks Overview]{@link https://cloud.google.com/compute/docs/disks}
   * @see [Disks: aggregatedList API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/disks/aggregatedList}
   *
   * @param {object=} options - Disk search options.
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
   * @param {number} options.maxResults - Maximum number of disks to return.
   * @param {string} options.pageToken - A previously-returned page token
   *     representing part of the larger set of results to view.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Disk[]} callback.disks - Disk objects from your
   *     project.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * gce.getDisks(function(err, disks) {
   *   // `disks` is an array of `Disk` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, disks, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     gce.getDisks(nextQuery, callback);
   *   }
   * }
   *
   * gce.getDisks({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * gce.getDisks().then(function(data) {
   *   var disks = data[0];
   * });
   */
  getDisks(
    options?: GetResourcesOptions | GetResourcesCallback<Disk>,
    callback?: GetResourcesCallback<Disk>
  ): void | GetResourcesPromise<Disk> {
    const [opts, cb] = common.util.maybeOptionsOrCallback<
      GetResourcesOptions,
      GetResourcesCallback<Disk>
    >(options, callback);
    this.request({uri: '/aggregated/disks', qs: opts}, (err, resp) => {
      if (err) {
        cb(err, null, null, resp);
        return;
      }
      let nextQuery = null;
      if (resp.nextPageToken) {
        nextQuery = Object.assign({}, opts, {pageToken: resp.nextPageToken});
      }
      const zones = resp.items || {};
      const disks = Object.keys(zones).reduce<Disk[]>((acc, zoneName) => {
        const zone = this.zone(zoneName.replace('zones/', ''));
        const disks: common.Metadata[] = zones[zoneName].disks || [];
        disks.forEach(disk => {
          const diskInstance = zone.disk(disk.name);
          diskInstance.metadata = disk;
          acc.push(diskInstance);
        });
        return acc;
      }, []);
      cb(null, disks, nextQuery, resp);
    });
  }
  getInstanceGroups(
    options?: GetResourcesOptions
  ): GetResourcesPromise<InstanceGroup>;
  getInstanceGroups(callback: GetResourcesCallback<InstanceGroup>): void;
  getInstanceGroups(
    options: GetResourcesOptions,
    callback: GetResourcesCallback<InstanceGroup>
  ): void;
  /**
   * Get a list of instance groups.
   *
   * @see [InstanceGroups Overview]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroups}
   * @see [InstanceGroups: aggregatedList API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroups/aggregatedList}
   *
   * @param {object=} options - Instance group search options.
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
   * @param {number} options.maxResults - Maximum number of instance groups to
   *     return.
   * @param {string} options.pageToken - A previously-returned page token
   *     representing part of the larger set of results to view.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {InstanceGroup[]} callback.instanceGroups -
   *     InstanceGroup objects from your project.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * gce.getInstanceGroups(function(err, instanceGroups) {
   *   // `instanceGroups` is an array of `InstanceGroup` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, instanceGroups, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     gce.getInstanceGroups(nextQuery, callback);
   *   }
   * }
   *
   * gce.getInstanceGroups({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * gce.getInstanceGroups().then(function(data) {
   *   var instanceGroups = data[0];
   * });
   */
  getInstanceGroups(
    options?: GetResourcesOptions | GetResourcesCallback<InstanceGroup>,
    callback?: GetResourcesCallback<InstanceGroup>
  ): void | GetResourcesPromise<InstanceGroup> {
    const [opts, cb] = common.util.maybeOptionsOrCallback<
      GetResourcesOptions,
      GetResourcesCallback<InstanceGroup>
    >(options, callback);
    this.request({uri: '/aggregated/instanceGroups', qs: opts}, (err, resp) => {
      if (err) {
        cb(err, null, null, resp);
        return;
      }
      let nextQuery = null;
      if (resp.nextPageToken) {
        nextQuery = Object.assign({}, opts, {pageToken: resp.nextPageToken});
      }
      const zones = resp.items || {};
      const instanceGroups = Object.keys(zones).reduce<InstanceGroup[]>(
        (acc, zoneName) => {
          const zone = this.zone(zoneName.replace('zones/', ''));
          const instanceGroups: common.Metadata[] =
            zones[zoneName].instanceGroups || [];
          instanceGroups.forEach(group => {
            const instanceGroupInstance = zone.instanceGroup(group.name);
            instanceGroupInstance.metadata = group;
            acc.push(instanceGroupInstance);
          });
          return acc;
        },
        []
      );
      cb(null, instanceGroups, nextQuery, resp);
    });
  }
  getFirewalls(options?: GetResourcesOptions): GetResourcesPromise<Firewall>;
  getFirewalls(callback: GetResourcesCallback<Firewall>): void;
  getFirewalls(
    options: GetResourcesOptions,
    callback: GetResourcesCallback<Firewall>
  ): void;
  /**
   * Get a list of firewalls.
   *
   * @see [Firewalls Overview]{@link https://cloud.google.com/compute/docs/networking#firewalls}
   * @see [Firewalls: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/firewalls/list}
   *
   * @param {object=} options - Firewall search options.
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
   * @param {number} options.maxResults - Maximum number of firewalls to return.
   * @param {string} options.pageToken - A previously-returned page token
   *     representing part of the larger set of results to view.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Firewall[]} callback.firewalls - Firewall objects from
   *     your project.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * gce.getFirewalls(function(err, firewalls) {
   *   // `firewalls` is an array of `Firewall` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, firewalls, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     gce.getFirewalls(nextQuery, callback);
   *   }
   * }
   *
   * gce.getFirewalls({
   *   autoPaginate: false
   * }, callback);
   *
   * gce.getFirewalls().then(function(data) {
   *   var firewalls = data[0];
   * });
   */
  getFirewalls(
    options?: GetResourcesOptions | GetResourcesCallback<Firewall>,
    callback?: GetResourcesCallback<Firewall>
  ): void | GetResourcesPromise<Firewall> {
    const [opts, cb] = common.util.maybeOptionsOrCallback<
      GetResourcesOptions,
      GetResourcesCallback<Firewall>
    >(options, callback);
    this.request({uri: '/global/firewalls', qs: opts}, (err, resp) => {
      if (err) {
        cb(err, null, null, resp);
        return;
      }
      let nextQuery = null;
      if (resp.nextPageToken) {
        nextQuery = Object.assign({}, opts, {pageToken: resp.nextPageToken});
      }
      const firewalls = ((resp.items as common.Metadata[]) || []).map(
        firewall => {
          const firewallInstance = this.firewall(firewall.name);
          firewallInstance.metadata = firewall;
          return firewallInstance;
        }
      );
      cb(null, firewalls, nextQuery, resp);
    });
  }
  getHealthChecks(
    options?: GetHealthChecksOptions
  ): GetResourcesPromise<HealthCheck>;
  getHealthChecks(callback: GetResourcesCallback<HealthCheck>): void;
  getHealthChecks(
    options: GetHealthChecksOptions,
    callback: GetResourcesCallback<HealthCheck>
  ): void;
  /**
   * Get a list of health checks.
   *
   * @see [Health Checks Overview]{@link https://cloud.google.com/compute/docs/load-balancing/health-checks}
   * @see [HttpHealthCheck: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/httpHealthChecks/list}
   * @see [HttpsHealthCheck: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/httpsHealthChecks/list}
   *
   * @param {object=} options - Health check search options.
   * @param {boolean} options.autoPaginate - Have pagination handled
   *     automatically. Default: true.
   * @param {string} options.filter - Search filter in the format of
   *     `{name} {comparison} {filterString}`.
   *     - **`name`**: the name of the field to compare
   *     - **`comparison`**: the comparison operator, `eq` (equal) or `ne`
   *       (not equal)
   *     - **`filterString`**: the string to filter to. For string fields, this
   *       can be a regular expression.
   * @param {boolean} options.https - List only HTTPs health checks. Default:
   *     `false`.
   * @param {number} options.maxApiCalls - Maximum number of API calls to make.
   * @param {number} options.maxResults - Maximum number of networks to return.
   * @param {string} options.pageToken - A previously-returned page token
   *     representing part of the larger set of results to view.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {HealthCheck[]} callback.healthChecks - HealthCheck
   *     objects from your project.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * gce.getHealthChecks(function(err, healthChecks) {
   *   // `healthChecks` is an array of `HealthCheck` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, healthChecks, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     gce.getHealthChecks(nextQuery, callback);
   *   }
   * }
   *
   * gce.getHealthChecks({
   *   autoPaginate: false
   * }, callback);
   *
   * gce.getHealthChecks().then(function(data) {
   *   var healthChecks = data[0];
   * });
   */
  getHealthChecks(
    options?: GetHealthChecksOptions | GetResourcesCallback<HealthCheck>,
    callback?: GetResourcesCallback<HealthCheck>
  ): void | GetResourcesPromise<HealthCheck> {
    const [opts, cb] = common.util.maybeOptionsOrCallback<
      GetHealthChecksOptions,
      GetResourcesCallback<HealthCheck>
    >(options, callback);
    const qs = Object.assign({}, opts);
    const https = qs.https;
    delete qs.https;
    this.request(
      {
        uri: '/global/' + (https ? 'httpsHealthChecks' : 'httpHealthChecks'),
        qs: qs,
      },
      (err, resp) => {
        if (err) {
          cb(err, null, null, resp);
          return;
        }
        let nextQuery = null;
        if (resp.nextPageToken) {
          nextQuery = Object.assign({}, qs, {pageToken: resp.nextPageToken});
        }
        const healthChecks = ((resp.items as common.Metadata[]) || []).map(
          healthCheck => {
            const healthCheckInstance = this.healthCheck(healthCheck.name, {
              https: https,
            });
            healthCheckInstance.metadata = healthCheck;
            return healthCheckInstance;
          }
        );
        cb(null, healthChecks, nextQuery, resp);
      }
    );
  }
  getImages(options?: GetResourcesOptions): GetResourcesPromise<Image>;
  getImages(callback: GetResourcesCallback<Image>): void;
  getImages(
    options: GetResourcesOptions,
    callback: GetResourcesCallback<Image>
  ): void;
  /**
   * Get a list of images.
   *
   * @see [Images Overview]{@link https://cloud.google.com/compute/docs/images}
   * @see [Images: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/images}
   *
   * @param {object=} options - Image search options.
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
   * @param {number} options.maxResults - Maximum number of images to return.
   * @param {string} options.pageToken - A previously-returned page token
   *     representing part of the larger set of results to view.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Image[]} callback.images - Image objects from your project.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * gce.getImages(function(err, images) {
   *   // `images` is an array of `Image` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, images, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     gce.getImages(nextQuery, callback);
   *   }
   * }
   *
   * gce.getImages({
   *   autoPaginate: false
   * }, callback);
   *
   * gce.getImages().then(function(data) {
   *   var images = data[0];
   * });
   */
  getImages(
    options?: GetResourcesOptions | GetResourcesCallback<Image>,
    callback?: GetResourcesCallback<Image>
  ): void | GetResourcesPromise<Image> {
    const [opts, cb] = common.util.maybeOptionsOrCallback<
      GetResourcesOptions,
      GetResourcesCallback<Image>
    >(options, callback);
    this.request({uri: '/global/images', qs: opts}, (err, resp) => {
      if (err) {
        cb(err, null, null, resp);
        return;
      }
      let nextQuery = null;
      if (resp.nextPageToken) {
        nextQuery = Object.assign({}, opts, {pageToken: resp.nextPageToken});
      }
      const images = ((resp.items as common.Metadata[]) || []).map(image => {
        const imageInstance = this.image(image.name);
        imageInstance.metadata = image;
        return imageInstance;
      });
      cb(null, images, nextQuery, resp);
    });
  }
  getMachineTypes(
    options?: GetResourcesOptions
  ): GetResourcesPromise<MachineType>;
  getMachineTypes(callback: GetResourcesCallback<MachineType>): void;
  getMachineTypes(
    options: GetResourcesOptions,
    callback: GetResourcesCallback<MachineType>
  ): void;
  /**
   * Get a list of machine types in this project.
   *
   * @see [MachineTypes: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/machineTypes/aggregatedList}
   * @see [Machine Types Overview]{@link https://cloud.google.com/compute/docs/machine-types}
   * @see [MachineType Resource]{@link https://cloud.google.com/compute/docs/reference/v1/machineTypes}
   *
   * @param {object=} options - Machine type search options.
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
   * @param {number} options.maxResults - Maximum number of machineTypes to
   *     return.
   * @param {string} options.pageToken - A previously-returned page token
   *     representing part of the larger set of results to view.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {MachineType[]} callback.machineTypes - MachineType
   *     objects from your project.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * gce.getMachineTypes(function(err, machineTypes) {
   *   // `machineTypes` is an array of `MachineType` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, machineTypes, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     gce.getMachineTypes(nextQuery, callback);
   *   }
   * }
   *
   * gce.getMachineTypes({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * gce.getMachineTypes().then(function(data) {
   *   var machineTypes = data[0];
   * });
   */
  getMachineTypes(
    options?: GetResourcesOptions | GetResourcesCallback<MachineType>,
    callback?: GetResourcesCallback<MachineType>
  ): void | GetResourcesPromise<MachineType> {
    const [opts, cb] = common.util.maybeOptionsOrCallback<
      GetResourcesOptions,
      GetResourcesCallback<MachineType>
    >(options, callback);
    this.request({uri: '/aggregated/machineTypes', qs: opts}, (err, resp) => {
      if (err) {
        cb(err, null, null, resp);
        return;
      }
      let nextQuery = null;
      if (resp.nextPageToken) {
        nextQuery = Object.assign({}, opts, {
          pageToken: resp.nextPageToken,
        });
      }
      const zones = resp.items || {};
      const machineTypes = Object.keys(zones).reduce<MachineType[]>(
        (acc, zoneName) => {
          const zone = this.zone(zoneName.replace('zones/', ''));
          const machineTypesByZone: common.Metadata[] =
            zones[zoneName].machineTypes || [];
          machineTypesByZone.forEach(machineType => {
            const machineTypeInstance = zone.machineType(machineType.name);
            machineTypeInstance.metadata = machineType;
            acc.push(machineTypeInstance);
          });
          return acc;
        },
        []
      );
      cb(null, machineTypes, nextQuery, resp);
    });
  }
  getNetworks(options?: GetResourcesOptions): GetResourcesPromise<Network>;
  getNetworks(callback: GetResourcesCallback<Network>): void;
  getNetworks(
    options: GetResourcesOptions,
    callback: GetResourcesCallback<Network>
  ): void;
  /**
   * Get a list of networks.
   *
   * @see [Networks Overview]{@link https://cloud.google.com/compute/docs/networking#networks}
   * @see [Networks: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/networks/list}
   *
   * @param {object=} options - Network search options.
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
   * @param {number} options.maxResults - Maximum number of networks to return.
   * @param {string} options.pageToken - A previously-returned page token
   *     representing part of the larger set of results to view.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Network[]} callback.networks - Network objects from
   *     your project.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * gce.getNetworks(function(err, networks) {
   *   // `networks` is an array of `Network` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, networks, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     gce.getNetworks(nextQuery, callback);
   *   }
   * }
   *
   * gce.getNetworks({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * gce.getNetworks().then(function(data) {
   *   var networks = data[0];
   * });
   */
  getNetworks(
    options?: GetResourcesOptions | GetResourcesCallback<Network>,
    callback?: GetResourcesCallback<Network>
  ): void | GetResourcesPromise<Network> {
    const [opts, cb] = common.util.maybeOptionsOrCallback<
      GetResourcesOptions,
      GetResourcesCallback<Network>
    >(options, callback);
    this.request({uri: '/global/networks', qs: opts}, (err, resp) => {
      if (err) {
        cb(err, null, null, resp);
        return;
      }
      let nextQuery = null;
      if (resp.nextPageToken) {
        nextQuery = Object.assign({}, opts, {pageToken: resp.nextPageToken});
      }
      const networks = ((resp.items as common.Metadata[]) || []).map(
        network => {
          const networkInstance = this.network(network.name);
          networkInstance.metadata = network;
          return networkInstance;
        }
      );
      cb(null, networks, nextQuery, resp);
    });
  }
  getOperations(options?: GetResourcesOptions): GetResourcesPromise<Operation>;
  getOperations(callback: GetResourcesCallback<Operation>): void;
  getOperations(
    options: GetResourcesOptions,
    callback: GetResourcesCallback<Operation>
  ): void;
  /**
   * Get a list of global operations.
   *
   * @see [Global Operation Overview]{@link https://cloud.google.com/compute/docs/reference/v1/globalOperations}
   * @see [GlobalOperations: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/globalOperations/list}
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
   *     from your project.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * gce.getOperations(function(err, operations) {
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
   *     gce.getOperations(nextQuery, callback);
   *   }
   * }
   *
   * gce.getOperations({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * gce.getOperations().then(function(data) {
   *   var operations = data[0];
   * });
   */
  getOperations(
    options?: GetResourcesOptions | GetResourcesCallback<Operation>,
    callback?: GetResourcesCallback<Operation>
  ): void | GetResourcesPromise<Operation> {
    const [opts, cb] = common.util.maybeOptionsOrCallback<
      GetResourcesOptions,
      GetResourcesCallback<Operation>
    >(options, callback);
    this.request({uri: '/global/operations', qs: opts}, (err, resp) => {
      if (err) {
        cb(err, null, null, resp);
        return;
      }
      let nextQuery = null;
      if (resp.nextPageToken) {
        nextQuery = Object.assign({}, opts, {pageToken: resp.nextPageToken});
      }
      const operations = ((resp.items as common.Metadata[]) || []).map(
        operation => {
          const operationInstance = this.operation(operation.name);
          operationInstance.metadata = operation;
          return operationInstance;
        }
      );
      cb(null, operations, nextQuery, resp);
    });
  }
  getRegions(options?: GetResourcesOptions): GetResourcesPromise<Region>;
  getRegions(callback: GetResourcesCallback<Region>): void;
  getRegions(
    options: GetResourcesOptions,
    callback: GetResourcesCallback<Region>
  ): void;
  /**
   * Return the regions available to your project.
   *
   * @see [Regions & Zones Overview]{@link https://cloud.google.com/compute/docs/zones}
   * @see [Regions: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/regions/list}
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
   * @param {number} options.maxResults - Maximum number of instances to return.
   * @param {string} options.pageToken - A previously-returned page token
   *     representing part of the larger set of results to view.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Region[]} callback.regions - Region objects that are
   *     available to your project.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * gce.getRegions(function(err, regions) {
   *   // `regions` is an array of `Region` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, regions, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     gce.getRegions(nextQuery, callback);
   *   }
   * }
   *
   * gce.getRegions({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * gce.getRegions().then(function(data) {
   *   var regions = data[0];
   * });
   */
  getRegions(
    options?: GetResourcesOptions | GetResourcesCallback<Region>,
    callback?: GetResourcesCallback<Region>
  ): void | GetResourcesPromise<Region> {
    const [opts, cb] = common.util.maybeOptionsOrCallback<
      GetResourcesOptions,
      GetResourcesCallback<Region>
    >(options, callback);
    this.request({uri: '/regions', qs: opts}, (err, resp) => {
      if (err) {
        cb(err, null, null, resp);
        return;
      }
      let nextQuery = null;
      if (resp.nextPageToken) {
        nextQuery = Object.assign({}, opts, {pageToken: resp.nextPageToken});
      }
      const regions = (resp.items as common.Metadata[]).map(region => {
        const regionInstance = this.region(region.name);
        regionInstance.metadata = region;
        return regionInstance;
      });
      cb(null, regions, nextQuery, resp);
    });
  }
  getRules(options?: GetResourcesOptions): GetResourcesPromise<Rule>;
  getRules(callback: GetResourcesCallback<Rule>): void;
  getRules(
    options: GetResourcesOptions,
    callback: GetResourcesCallback<Rule>
  ): void;
  /**
   * Get a list of forwarding rules.
   *
   * @see [GlobalForwardingRules: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/globalForwardingRules/list}
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
   * @param {Rule[]} callback.rules - Rule objects from your
   *     project.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * gce.getRules(function(err, rules) {
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
   *     gce.getRules(nextQuery, callback);
   *   }
   * }
   *
   * gce.getRules({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * gce.getRules().then(function(data) {
   *   var rules = data[0];
   * });
   */
  getRules(
    options?: GetResourcesOptions | GetResourcesCallback<Rule>,
    callback?: GetResourcesCallback<Rule>
  ): void | GetResourcesPromise<Rule> {
    const [opts, cb] = common.util.maybeOptionsOrCallback<
      GetResourcesOptions,
      GetResourcesCallback<Rule>
    >(options, callback);
    this.request({uri: '/global/forwardingRules', qs: opts}, (err, resp) => {
      if (err) {
        cb(err, null, null, resp);
        return;
      }
      let nextQuery = null;
      if (resp.nextPageToken) {
        nextQuery = Object.assign({}, opts, {pageToken: resp.nextPageToken});
      }
      const rules = ((resp.items as common.Metadata[]) || []).map(rule => {
        const ruleInstance = this.rule(rule.name);
        ruleInstance.metadata = rule;
        return ruleInstance;
      });
      cb(null, rules, nextQuery, resp);
    });
  }
  getServices(options?: GetResourcesOptions): GetResourcesPromise<Service>;
  getServices(callback: GetResourcesCallback<Service>): void;
  getServices(
    options: GetResourcesOptions,
    callback: GetResourcesCallback<Service>
  ): void;
  /**
   * Get a list of backend services.
   *
   * @see [Backend Services Overview]{@link https://cloud.google.com/compute/docs/load-balancing/http/backend-service}
   * @see [BackendServices: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/backendServices/list}
   *
   * @param {object=} options - BackendService search options.
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
   * @param {number} options.maxResults - Maximum number of snapshots to return.
   * @param {string} options.pageToken - A previously-returned page token
   *     representing part of the larger set of results to view.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Service[]} callback.services - Service objects from
   *     your project.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * gce.getServices(function(err, services) {
   *   // `services` is an array of `Service` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, services, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     gce.getServices(nextQuery, callback);
   *   }
   * }
   *
   * gce.getServices({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * gce.getServices().then(function(data) {
   *   var services = data[0];
   * });
   */
  getServices(
    options?: GetResourcesOptions | GetResourcesCallback<Service>,
    callback?: GetResourcesCallback<Service>
  ): void | GetResourcesPromise<Service> {
    const [opts, cb] = common.util.maybeOptionsOrCallback<
      GetResourcesOptions,
      GetResourcesCallback<Service>
    >(options, callback);
    this.request({uri: '/global/backendServices', qs: opts}, (err, resp) => {
      if (err) {
        cb(err, null, null, resp);
        return;
      }
      let nextQuery = null;
      if (resp.nextPageToken) {
        nextQuery = Object.assign({}, opts, {pageToken: resp.nextPageToken});
      }
      const services = ((resp.items as common.Metadata[]) || []).map(
        service => {
          const serviceInstance = this.service(service.name);
          serviceInstance.metadata = service;
          return serviceInstance;
        }
      );
      cb(null, services, nextQuery, resp);
    });
  }
  getSnapshots(options?: GetResourcesOptions): GetResourcesPromise<Snapshot>;
  getSnapshots(callback: GetResourcesCallback<Snapshot>): void;
  getSnapshots(
    options: GetResourcesOptions,
    callback: GetResourcesCallback<Snapshot>
  ): void;
  /**
   * Get a list of snapshots.
   *
   * @see [Snapshots Overview]{@link https://cloud.google.com/compute/docs/disks/persistent-disks#snapshots}
   * @see [Snapshots: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/snapshots/list}
   *
   * @param {object=} options - Snapshot search options.
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
   * @param {number} options.maxResults - Maximum number of snapshots to return.
   * @param {string} options.pageToken - A previously-returned page token
   *     representing part of the larger set of results to view.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Snapshot[]} callback.snapshots - Snapshot objects from
   *     your project.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * gce.getSnapshots(function(err, snapshots) {
   *   // `snapshots` is an array of `Snapshot` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, snapshots, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     gce.getSnapshots(nextQuery, callback);
   *   }
   * }
   *
   * gce.getSnapshots({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * gce.getSnapshots().then(function(data) {
   *   var snapshots = data[0];
   * });
   */
  getSnapshots(
    options?: GetResourcesOptions | GetResourcesCallback<Snapshot>,
    callback?: GetResourcesCallback<Snapshot>
  ): void | GetResourcesPromise<Snapshot> {
    const [opts, cb] = common.util.maybeOptionsOrCallback<
      GetResourcesOptions,
      GetResourcesCallback<Snapshot>
    >(options, callback);
    this.request({uri: '/global/snapshots', qs: opts}, (err, resp) => {
      if (err) {
        cb(err, null, null, resp);
        return;
      }
      let nextQuery = null;
      if (resp.nextPageToken) {
        nextQuery = Object.assign({}, opts, {pageToken: resp.nextPageToken});
      }
      const snapshots = ((resp.items as common.Metadata[]) || []).map(
        snapshot => {
          const snapshotInstance = this.snapshot(snapshot.name);
          snapshotInstance.metadata = snapshot;
          return snapshotInstance;
        }
      );
      cb(null, snapshots, nextQuery, resp);
    });
  }
  getSubnetworks(
    options?: GetResourcesOptions
  ): GetResourcesPromise<Subnetwork>;
  getSubnetworks(callback: GetResourcesCallback<Subnetwork>): void;
  getSubnetworks(
    options: GetResourcesOptions,
    callback: GetResourcesCallback<Subnetwork>
  ): void;
  /**
   * Get a list of subnetworks in this project.
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
   *     objects from your project.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * gce.getSubnetworks(function(err, subnetworks) {
   *   // `subnetworks` is an array of `Subnetworks` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, subnetworks, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     gce.getSubnetworks(nextQuery, callback);
   *   }
   * }
   *
   * gce.getSubnetworks({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * gce.getSubnetworks().then(function(data) {
   *   var subnetworks = data[0];
   * });
   */
  getSubnetworks(
    options?: GetResourcesOptions | GetResourcesCallback<Subnetwork>,
    callback?: GetResourcesCallback<Subnetwork>
  ): void | GetResourcesPromise<Subnetwork> {
    const [opts, cb] = common.util.maybeOptionsOrCallback<
      GetResourcesOptions,
      GetResourcesCallback<Subnetwork>
    >(options, callback);
    this.request({uri: '/aggregated/subnetworks', qs: opts}, (err, resp) => {
      if (err) {
        cb(err, null, null, resp);
        return;
      }
      let nextQuery = null;
      if (resp.nextPageToken) {
        nextQuery = Object.assign({}, opts, {pageToken: resp.nextPageToken});
      }
      const regions = resp.items || {};
      const subnetworks = Object.keys(regions).reduce<Subnetwork[]>(
        (acc, regionName) => {
          const region = this.region(regionName.replace('regions/', ''));
          const subnetworks: common.Metadata[] =
            regions[regionName].subnetworks || [];
          subnetworks.forEach(subnetwork => {
            const subnetworkInstance = region.subnetwork(subnetwork.name);
            subnetworkInstance.metadata = subnetwork;
            acc.push(subnetworkInstance);
          });
          return acc;
        },
        []
      );
      cb(null, subnetworks, nextQuery, resp);
    });
  }
  getVMs(options?: GetResourcesOptions): GetResourcesPromise<VM>;
  getVMs(callback: GetResourcesCallback<VM>): void;
  getVMs(
    options: GetResourcesOptions,
    callback: GetResourcesCallback<VM>
  ): void;
  /**
   * Get a list of virtual machine instances.
   *
   * @see [Instances and Networks]{@link https://cloud.google.com/compute/docs/instances-and-network}
   * @see [Instances: aggregatedList API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/aggregatedList}
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
   * @param {number} options.maxResults - Maximum number of instances to return.
   * @param {string} options.pageToken - A previously-returned page token
   *     representing part of the larger set of results to view.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {VM[]} callback.vms - VM objects from your project.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * gce.getVMs(function(err, vms) {
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
   *     gce.getVMs(nextQuery, callback);
   *   }
   * }
   *
   * gce.getVMs({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * gce.getVMs().then(function(data) {
   *   var vms = data[0];
   * });
   */
  getVMs(
    options?: GetResourcesOptions | GetResourcesCallback<VM>,
    callback?: GetResourcesCallback<VM>
  ): void | GetResourcesPromise<VM> {
    const [opts, cb] = common.util.maybeOptionsOrCallback<
      GetResourcesOptions,
      GetResourcesCallback<VM>
    >(options, callback);
    this.request({uri: '/aggregated/instances', qs: opts}, (err, resp) => {
      if (err) {
        cb(err, null, null, resp);
        return;
      }
      let nextQuery = null;
      if (resp.nextPageToken) {
        nextQuery = Object.assign({}, opts, {pageToken: resp.nextPageToken});
      }
      const zones = resp.items || {};
      const vms = Object.keys(zones).reduce<VM[]>((acc, zoneName) => {
        const zone = this.zone(zoneName.replace('zones/', ''));
        const instances: common.Metadata[] = zones[zoneName].instances || [];
        instances.forEach(instance => {
          const vmInstance = zone.vm(instance.name);
          vmInstance.metadata = instance;
          acc.push(vmInstance);
        });
        return acc;
      }, []);
      cb(null, vms, nextQuery, resp);
    });
  }
  getZones(options?: GetResourcesOptions): GetResourcesPromise<Zone>;
  getZones(callback: GetResourcesCallback<Zone>): void;
  getZones(
    options: GetResourcesOptions,
    callback: GetResourcesCallback<Zone>
  ): void;
  /**
   * Return the zones available to your project.
   *
   * @see [Regions & Zones Overview]{@link https://cloud.google.com/compute/docs/zones}
   * @see [Zones: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/zones/list}
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
   * @param {number} options.maxResults - Maximum number of instances to return.
   * @param {string} options.pageToken - A previously-returned page token
   *     representing part of the larger set of results to view.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Zone[]} callback.zones - Zone objects that are
   *     available to your project.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * gce.getZones(function(err, zones) {
   *   // `zones` is an array of `Zone` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, zones, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     gce.getZones(nextQuery, callback);
   *   }
   * }
   *
   * gce.getZones({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * gce.getZones().then(function(data) {
   *   var zones = data[0];
   * });
   */
  getZones(
    options?: GetResourcesOptions | GetResourcesCallback<Zone>,
    callback?: GetResourcesCallback<Zone>
  ): void | GetResourcesPromise<Zone> {
    const [opts, cb] = common.util.maybeOptionsOrCallback<
      GetResourcesOptions,
      GetResourcesCallback<Zone>
    >(options, callback);
    this.request({uri: '/zones', qs: opts}, (err, resp) => {
      if (err) {
        cb(err, null, null, resp);
        return;
      }
      let nextQuery = null;
      if (resp.nextPageToken) {
        nextQuery = Object.assign({}, opts, {pageToken: resp.nextPageToken});
      }
      const zones = (resp.items as common.Metadata[]).map(zone => {
        const zoneInstance = this.zone(zone.name);
        zoneInstance.metadata = zone;
        return zoneInstance;
      });
      cb(null, zones, nextQuery, resp);
    });
  }
  /**
   * Get a reference to a Google Compute Engine health check.
   *
   * @see [Health Checks Overview]{@link https://cloud.google.com/compute/docs/load-balancing/health-checks}
   *
   * @param {string} name - Name of the health check.
   * @param {object=} options - Configuration object.
   * @param {boolean} options.https - Specify if this is an HTTPS health check
   *     resource. Default: `false`
   * @returns {HealthCheck}
   *
   * @example
   * var healthCheck = gce.healthCheck('http-health-check-name');
   *
   * //-
   * // Access an HTTPS health check.
   * //-
   * var httpsHealthCheck = gce.healthCheck('https-health-check-name', {
   *   https: true
   * });
   */
  healthCheck(name: string, options?: {https?: boolean}): HealthCheck {
    return new HealthCheck(this, name, options);
  }
  /**
   * Get a reference to a Google Compute Engine image.
   *
   * @see [Images Overview]{@link https://cloud.google.com/compute/docs/images}
   *
   * @param {string} name - Name of the image.
   * @returns {Image}
   *
   * @example
   * var image = gce.image('image-name');
   */
  image(name: string): Image {
    return new Image(this, name);
  }
  /**
   * Get a reference to a Google Compute Engine network.
   *
   * @see [Networks Overview]{@link https://cloud.google.com/compute/docs/networking#networks}
   *
   * @param {string} name - Name of the network.
   * @returns {Network}
   *
   * @example
   * var network = gce.network('network-name');
   */
  network(name: string): Network {
    return new Network(this, name);
  }
  /**
   * Get a reference to a global Google Compute Engine operation.
   *
   * @see [Global Operation Overview]{@link https://cloud.google.com/compute/docs/reference/v1/globalOperations}
   *
   * @param {string} name - Name of the existing operation.
   * @returns {Operation}
   *
   * @example
   * var operation = gce.operation('operation-name');
   */
  operation(name: string): Operation {
    return new Operation(this, name);
  }
  /**
   * Get a reference to your Google Compute Engine project.
   *
   * @see [Projects Overview]{@link https://cloud.google.com/compute/docs/reference/v1/projects}
   *
   * @returns {Project}
   *
   * @example
   * var project = gce.project();
   */
  project(): Project {
    return new Project(this);
  }
  /**
   * Get a reference to a Google Compute Engine region.
   *
   * @see [Regions & Zones Overview]{@link https://cloud.google.com/compute/docs/zones}
   *
   * @param {string} name - Name of the region.
   * @returns {Region}
   *
   * @example
   * var region = gce.region('region-name');
   */
  region(name: string): Region {
    return new Region(this, name);
  }
  /**
   * Get a reference to a Google Compute Engine forwading rule.
   *
   * @param {string} name - Name of the rule.
   * @returns {Rule}
   *
   * @example
   * var rule = gce.rule('rule-name');
   */
  rule(name: string): Rule {
    return new Rule(this, name);
  }
  /**
   * Get a reference to a Google Compute Engine backend service.
   *
   * @see [Backend Services Overview]{@link https://cloud.google.com/compute/docs/load-balancing/http/backend-service}
   *
   * @param {string} name - Name of the existing service.
   * @returns {Service}
   *
   * @example
   * var service = gce.service('service-name');
   */
  service(name: string): Service {
    return new Service(this, name);
  }
  /**
   * Get a reference to a Google Compute Engine snapshot.
   *
   * @see [Snapshots Overview]{@link https://cloud.google.com/compute/docs/disks/persistent-disks#snapshots}
   *
   * @param {string} name - Name of the existing snapshot.
   * @returns {Snapshot}
   *
   * @example
   * var snapshot = gce.snapshot('snapshot-name');
   */
  snapshot(name: string): Snapshot {
    return new Snapshot(this, name);
  }
  /**
   * Get a reference to a Google Compute Engine zone.
   *
   * @see [Regions & Zones Overview]{@link https://cloud.google.com/compute/docs/zones}
   *
   * @param {string} name - Name of the zone.
   * @returns {Zone}
   *
   * @example
   * var zone = gce.zone('zone-name');
   */
  zone(name: string): Zone {
    return new Zone(this, name);
  }
  /**
   * Register a single callback that will wait for an operation to finish before
   * being executed.
   *
   * @returns {function} callback - The callback function.
   * @returns {?error} callback.err - An error returned from the operation.
   * @returns {object} callback.apiResponse - The operation's final API response.
   */
  execAfterOperation_(callback: MetadataCallback) {
    return function (err: common.ApiError | null, ...args: common.Metadata[]) {
      // arguments = [..., op, apiResponse]
      const operation = args[args.length - 2] as Operation;
      const apiResponse = args[args.length - 1];
      if (err) {
        callback(err, apiResponse);
        return;
      }
      operation.on('error', callback).on('complete', metadata => {
        callback(null, metadata);
      });
    };
  }
}

/*! Developer Documentation
 *
 * These methods can be auto-paginated.
 */
paginator.extend(Compute, [
  'getAddresses',
  'getAutoscalers',
  'getDisks',
  'getFirewalls',
  'getImages',
  'getHealthChecks',
  'getInstanceGroups',
  'getMachineTypes',
  'getNetworks',
  'getOperations',
  'getRegions',
  'getRules',
  'getServices',
  'getSnapshots',
  'getSubnetworks',
  'getVMs',
  'getZones',
]);

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(Compute, {
  exclude: [
    'address',
    'autoscaler',
    'disk',
    'firewall',
    'image',
    'healthCheck',
    'instanceGroup',
    'machineType',
    'network',
    'operation',
    'project',
    'region',
    'rule',
    'service',
    'snapshot',
    'subnetwork',
    'vm',
    'zone',
  ],
});
