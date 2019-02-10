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

'use strict';

const arrify = require('arrify');
const async = require('async');
const common = require('@google-cloud/common');
const extend = require('extend');
const format = require('string-format-obj');
const {GCEImages} = require('gce-images');
const is = require('is');
const {promisifyAll} = require('@google-cloud/promisify');
const {paginator} = require('@google-cloud/paginator');
const {teenyRequest} = require('teeny-request');

const Autoscaler = require('./autoscaler.js');
const Disk = require('./disk.js');
const InstanceGroup = require('./instance-group.js');
const InstanceGroupManager = require('./instance-group-manager.js');
const MachineType = require('./machine-type.js');
const Operation = require('./operation.js');
const VM = require('./vm.js');

/**
 * A Zone object allows you to interact with a Google Compute Engine zone.
 *
 * @see [Regions & Zones Overview]{@link https://cloud.google.com/compute/docs/zones}
 * @see [Zone Resource]{@link https://cloud.google.com/compute/docs/reference/v1/zones}
 *
 * @class
 * @param {Compute} compute - Compute object this zone belongs to.
 * @param {string} name - Name of the zone.
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('us-central1-a');
 */
class Zone extends common.ServiceObject {
  constructor(compute, name) {
    const methods = {
      /**
       * Check if the zone exists.
       *
       * @method Zone#exists
       * @param {function} callback - The callback function.
       * @param {?error} callback.err - An error returned while making this
       *     request.
       * @param {boolean} callback.exists - Whether the zone exists or not.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const zone = compute.zone('us-central1-a');
       *
       * zone.exists(function(err, exists) {});
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * zone.exists().then(function(data) {
       *   const exists = data[0];
       * });
       */
      exists: true,
      /**
       * Get a zone.
       *
       * @method Zone#get
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const zone = compute.zone('us-central1-a');
       *
       * zone.get(function(err, zone, apiResponse) {
       *   // `zone` is a Zone object.
       * });
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * zone.get().then(function(data) {
       *   const zone = data[0];
       *   const apiResponse = data[1];
       * });
       */
      get: true,
      /**
       * Get the zone's metadata.
       *
       * @see [Zone Resource]{@link https://cloud.google.com/compute/docs/reference/v1/zones}
       * @see [Zones: get API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/zones/get}
       *
       * @method Zone#getMetadata
       * @param {function=} callback - The callback function.
       * @param {?error} callback.err - An error returned while making this
       *     request.
       * @param {object} callback.metadata - The zone's metadata.
       * @param {object} callback.apiResponse - The full API response.
       *
       * @example
       * const Compute = require('@google-cloud/compute');
       * const compute = new Compute();
       * const zone = compute.zone('us-central1-a');
       *
       * zone.getMetadata(function(err, metadata, apiResponse) {});
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * zone.getMetadata().then(function(data) {
       *   const metadata = data[0];
       *   const apiResponse = data[1];
       * });
       */
      getMetadata: true,
    };
    super({
      parent: compute,
      baseUrl: '/zones',
      /**
       * @name Zone#id
       * @type {string}
       */
      id: name,
      methods: methods,
      requestModule: teenyRequest,
    });
    /**
     * The parent {@link Compute} instance of this {@link Zone} instance.
     * @name Zone#compute
     * @type {Compute}
     */
    this.compute = compute;
    /**
     * @name Zone#name
     * @type {string}
     */
    this.name = name;
    this.gceImages = new GCEImages({
      authClient: compute.authClient,
    });
  }
  /**
   * Get a reference to a Google Compute Engine autoscaler in this zone.
   *
   * @param {string} name - Name of the autoscaler.
   * @returns {Autoscaler}
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   *
   * const autoscaler = zone.autoscaler('autoscaler-name');
   */
  autoscaler(name) {
    return new Autoscaler(this, name);
  }
  /**
   * Create an autoscaler in this zone.
   *
   * @see [Load Balancing and Scaling]{@link https://cloud.google.com/compute/docs/load-balancing-and-autoscaling}
   * @see [Autoscaler Resource]{@link https://cloud.google.com/compute/docs/reference/v1/autoscalers}
   * @see [Autoscalers: insert API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/autoscalers/insert}
   *
   * @throws {Error} If `config.target` is not provided.
   *
   * @param {string} name - Name of the autoscaler.
   * @param {object} config - See an
   *     [Autoscaler resource](https://cloud.google.com/compute/docs/reference/v1/autoscalers).
   * @param {number} config.coolDown - The number of seconds that the autoscaler
   *     should wait before it starts collecting information from a new instance.
   *     Alias for `config.autoscalingPolicy.coolDownPeriodSec`.
   * @param {number} config.cpu - The target CPU utilization that the autoscaler
   *     should maintain, between 1 - 100. Alias for
   *     `config.autoscalingPolicy.cpuUtilization.utilizationTarget`.
   * @param {number} config.loadBalance - Backend capacity utilization that
   *     autoscaler should maintain, between 1 - 100. Alias for
   *     `config.autoscalingPolicy.loadBalancingUtilization.utilizationTarget`.
   * @param {number} config.maxReplicas - The maximum number of instances that the
   *     autoscaler can scale up to. Alias for
   *     `config.autoscalingPolicy.maxNumReplicas`.
   * @param {number} config.minReplicas - The minimum number of replicas that the
   *     autoscaler can scale down to. Alias for
   *     `config.autoscalingPolicy.minNumReplicas`.
   * @param {string} config.target - The name of the managed instance group that
   *     this autoscaler will scale.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Autoscaler} callback.autoscaler - The created
   *     Autoscaler object.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   *
   * const config = {
   *   coolDown: 30,
   *   cpu: 80,
   *   loadBalance: 40,
   *   maxReplicas: 5,
   *   minReplicas: 0,
   *   target: 'instance-group-manager-1'
   * };
   *
   * function callback(err, autoscaler, operation, apiResponse) {
   *   // `autoscaler` is an Autoscaler object.
   *
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * }
   *
   * zone.createAutoscaler('name', config, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * zone.createAutoscaler('name', config).then(function(data) {
   *   const autoscaler = data[0];
   *   const operation = data[1];
   *   const apiResponse = data[2];
   * });
   */
  createAutoscaler(name, config, callback) {
    const self = this;
    if (!config.target) {
      throw new Error('Cannot create an autoscaler without a target.');
    }
    const json = extend(true, {}, config, {
      name: name,
      autoscalingPolicy: {},
    });
    if (!/^https*:/.test(json.target)) {
      json.target = [
        'https://content.googleapis.com/compute/v1/projects/',
        this.compute.projectId,
        '/zones/',
        this.name,
        '/instanceGroupManagers/',
        json.target,
      ].join('');
    }
    if (is.defined(json.coolDown)) {
      json.autoscalingPolicy.coolDownPeriodSec = json.coolDown;
      delete json.coolDown;
    }
    if (is.defined(json.cpu)) {
      json.autoscalingPolicy.cpuUtilization = {
        utilizationTarget: json.cpu / 100,
      };
      delete json.cpu;
    }
    if (is.defined(json.loadBalance)) {
      json.autoscalingPolicy.loadBalancingUtilization = {
        utilizationTarget: json.loadBalance / 100,
      };
      delete json.loadBalance;
    }
    if (is.defined(json.maxReplicas)) {
      json.autoscalingPolicy.maxNumReplicas = json.maxReplicas;
      delete json.maxReplicas;
    }
    if (is.defined(json.minReplicas)) {
      json.autoscalingPolicy.minNumReplicas = json.minReplicas;
      delete json.minReplicas;
    }
    this.request(
      {
        method: 'POST',
        uri: '/autoscalers',
        json: json,
      },
      function(err, resp) {
        if (err) {
          callback(err, null, null, resp);
          return;
        }
        const autoscaler = self.autoscaler(name);
        const operation = self.operation(resp.name);
        operation.metadata = resp;
        callback(null, autoscaler, operation, resp);
      }
    );
  }
  /**
   * Create a persistent disk in this zone.
   *
   * @see [Disk Resource]{@link https://cloud.google.com/compute/docs/reference/v1/disks}
   * @see [Disks: insert API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/disks/insert}
   *
   * @param {string} name - Name of the disk.
   * @param {object} config - See a
   *     [Disk resource](https://cloud.google.com/compute/docs/reference/v1/disks).
   * @param {string=} config.os - Specify the name of an OS, and we will use the
   *     latest version as the source image of a new boot disk. See
   *     [this list of accepted OS names](https://github.com/stephenplusplus/gce-images#accepted-os-names).
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Disk} callback.disk - The created Disk object.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   *
   * //-
   * // Create a persistent disk using the latest Ubuntu version
   * // as the source image.
   * //-
   * const config = {
   *   os: 'ubuntu',
   *   sizeGb: 10
   * };
   *
   * //-
   * // Create a persistent disk using the latest Ubuntu version from your project
   * // as the source image.
   * //-
   * const config = {
   *   os: 'your-project-id-or-name/ubuntu',
   *   sizeGb: 10
   * };
   *
   * zone.createDisk('name', config, function(err, disk, operation, apiResponse) {
   *   // `disk` is a Disk object.
   *
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * zone.createDisk('name', config).then(function(data) {
   *   const disk = data[0];
   *   const operation = data[1];
   *   const apiResponse = data[2];
   * });
   */
  createDisk(name, config, callback) {
    const self = this;
    const query = {};
    const body = Object.assign({}, config, {
      name: name,
    });
    if (body.image) {
      query.sourceImage = body.image;
      delete body.image;
    }
    if (body.os) {
      this.gceImages.getLatest(body.os, function(err, image) {
        if (err) {
          callback(err);
          return;
        }
        delete body.os;
        body.sourceImage = image.selfLink;
        self.createDisk(name, body, callback);
      });
      return;
    }
    this.request(
      {
        method: 'POST',
        uri: '/disks',
        qs: query,
        json: body,
      },
      function(err, resp) {
        if (err) {
          callback(err, null, null, resp);
          return;
        }
        const disk = self.disk(name);
        const operation = self.operation(resp.name);
        operation.metadata = resp;
        callback(null, disk, operation, resp);
      }
    );
  }
  /**
   * Create an instance group in this zone.
   *
   * @see [InstanceGroup Resource]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroups#resource}
   * @see [InstanceGroups: insert API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroups/insert}
   *
   * @param {string} name - Name of the instance group.
   * @param {object} options - See an
   *     [InstanceGroup resource](https://cloud.google.com/compute/docs/reference/v1/instanceGroups#resource).
   * @param {object} options.ports - A map of names to ports. The key should be
   *     the name, and the value the port number. Maps to `options.namedPorts`.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {InstanceGroup} callback.instanceGroup - The created
   *     InstanceGroup object.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   *
   * function onCreated(err, instanceGroup, operation, apiResponse) {
   *   // `instanceGroup` is an InstanceGroup object.
   *
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * }
   *
   * zone.createInstanceGroup('instance-group-name', onCreated);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * zone.createInstanceGroup('instance-group-name', config).then(function(data) {
   *   const instanceGroup = data[0];
   *   const operation = data[1];
   *   const apiResponse = data[2];
   * });
   */
  createInstanceGroup(name, options, callback) {
    const self = this;
    if (is.fn(options)) {
      callback = options;
      options = {};
    }
    const body = Object.assign({}, options, {
      name: name,
    });
    if (body.ports) {
      body.namedPorts = InstanceGroup.formatPorts_(body.ports);
      delete body.ports;
    }
    this.request(
      {
        method: 'POST',
        uri: '/instanceGroups',
        json: body,
      },
      function(err, resp) {
        if (err) {
          callback(err, null, null, resp);
          return;
        }
        const instanceGroup = self.instanceGroup(name);
        const operation = self.operation(resp.name);
        operation.metadata = resp;
        callback(null, instanceGroup, operation, resp);
      }
    );
  }
  /**
   * Create a virtual machine in this zone.
   *
   * @see [Instance Resource]{@link https://cloud.google.com/compute/docs/reference/v1/instances}
   * @see [Instances: insert API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/insert}
   *
   * @param {string} name - Name of the instance.
   * @param {object} config - See an
   *     [Instance resource](https://cloud.google.com/compute/docs/reference/v1/instances).
   * @param {?object[]} config.disks - See a
   *     [Disk resource](https://cloud.google.com/compute/docs/reference/v1/disks).
   * @param {boolean=} config.http - Allow HTTP traffic. Default: `false`
   * @param {boolean=} config.https - Allow HTTPS traffic. Default: `false`
   * @param {?object[]} config.networkInterfaces - An array of configurations for
   *     this interface. This specifies how this interface should interact with
   *     other network services, such as connecting to the internet. Default:
   *     `[ { network: 'global/networks/default' } ]`
   * @param {string=} config.machineType - The machine type resource to use.
   *     Provide only the name of the machine, e.g. `n1-standard-16`. Refer to
   *     [Available Machine Types](https://goo.gl/jrHEbo). Default:
   *     `n1-standard-1`
   * @param {string=} config.os - Specify the name of an OS, and we will use the
   *     latest version as the source image of a new boot disk. See
   *     [this list of accepted OS names](https://github.com/stephenplusplus/gce-images#accepted-os-names).
   * @param {?string[]} config.tags - An array of tags.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {VM} callback.vm - The created VM object.
   * @param {Operation} callback.operation - An operation object
   *     that can be used to check the status of the request.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   *
   * //-
   * // Create a new instance using the latest Debian version from your project
   * // as the source image for a new boot disk.
   * //-
   * const config = {
   *   os: 'your-project-id-or-name/debian',
   *   http: true,
   *   tags: ['debian-server']
   * };
   *
   * //-
   * // Create a new instance using the latest Debian version as the source image
   * // for a new boot disk.
   * //-
   * const config = {
   *   os: 'debian',
   *   http: true,
   *   tags: ['debian-server']
   * };
   *
   * //-
   * // The above object will auto-expand behind the scenes to something like the
   * // following. The Debian version may be different when you run the command.
   * //-
   * const config = {
   *   machineType: 'n1-standard-1',
   *   disks: [
   *     {
   *       boot: true,
   *       initializeParams: {
   *         sourceImage:
   *           'https://www.googleapis.com/compute/v1/projects' +
   *           '/debian-cloud/global/images/debian-7-wheezy-v20150710'
   *       }
   *     }
   *   ],
   *   networkInterfaces: [
   *     {
   *       network: 'global/networks/default'
   *     }
   *   ],
   *   tags: [
   *     {
   *       items: [
   *         'debian-server',
   *         'http-server'
   *       ]
   *     }
   *   ]
   * };
   *
   * function callback(err, vm, operation, apiResponse) {
   *   // `vm` is a VM object.
   *
   *   // `operation` is an Operation object that can be used to check the status
   *   // of the request.
   * }
   *
   * zone.createVM('new-vm-name', config, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * zone.createVM('new-vm-name', config).then(function(data) {
   *   const vm = data[0];
   *   const operation = data[1];
   *   const apiResponse = data[2];
   * });
   */
  createVM(name, config, callback) {
    const self = this;
    const body = Object.assign(
      {
        name: name,
        machineType: 'n1-standard-1',
        networkInterfaces: [
          {
            network: 'global/networks/default',
          },
        ],
      },
      config
    );
    if (body.machineType.indexOf('/') === -1) {
      // The specified machineType is only a partial name, e.g. 'n1-standard-1'.
      body.machineType = format('zones/{zoneName}/machineTypes/{machineType}', {
        zoneName: this.name,
        machineType: body.machineType,
      });
    }
    if (is.array(body.tags)) {
      body.tags = {
        items: body.tags,
      };
    }
    if (body.http || body.https) {
      // We will add tags to the created instance (http-server and/or
      // https-server), and create the appropriate firewall rules to allow
      // connections on the necessary ports to these tags.
      const createFirewallMethods = [];
      body.networkInterfaces[0].accessConfigs = [
        {
          type: 'ONE_TO_ONE_NAT',
        },
      ];
      body.tags = body.tags || {};
      body.tags.items = body.tags.items || [];
      if (body.http) {
        delete body.http;
        createFirewallMethods.push(this.createHttpServerFirewall_.bind(this));
        if (body.tags.items.indexOf('http-server') === -1) {
          body.tags.items.push('http-server');
        }
      }
      if (body.https) {
        delete body.https;
        createFirewallMethods.push(this.createHttpsServerFirewall_.bind(this));
        if (body.tags.items.indexOf('https-server') === -1) {
          body.tags.items.push('https-server');
        }
      }
      // We have to make sure the firewall rules exist to allow HTTP/S traffic.
      async.parallel(createFirewallMethods, function(err) {
        if (err) {
          callback(err);
          return;
        }
        self.createVM(name, body, callback);
      });
      return;
    }
    if (body.os) {
      this.gceImages.getLatest(body.os, function(err, image) {
        if (err) {
          callback(err);
          return;
        }
        delete body.os;
        body.disks = body.disks || [];
        body.disks.push({
          autoDelete: true,
          boot: true,
          initializeParams: {
            sourceImage: image.selfLink,
          },
        });
        self.createVM(name, body, callback);
      });
      return;
    }
    this.request(
      {
        method: 'POST',
        uri: '/instances',
        json: body,
      },
      function(err, resp) {
        if (err) {
          callback(err, null, null, resp);
          return;
        }
        const vm = self.vm(name);
        const operation = self.operation(resp.name);
        operation.metadata = resp;
        callback(null, vm, operation, resp);
      }
    );
  }
  /**
   * Get a reference to a Google Compute Engine disk in this zone.
   *
   * @see [Disks Overview]{@link https://cloud.google.com/compute/docs/disks}
   *
   * @param {string} name - Name of the disk.
   * @returns {Disk}
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   *
   * const disk = zone.disk('disk1');
   */
  disk(name) {
    return new Disk(this, name);
  }
  /**
   * Get a list of autoscalers from this zone.
   *
   * @see [Managing Autoscalers]{@link https://cloud.google.com/compute/docs/autoscaler/managing-autoscalers}
   * @see [Understanding Autoscaler Decisions]{@link https://cloud.google.com/compute/docs/autoscaler/understanding-autoscaler-decisions}
   * @see [Autoscalers: aggregatedList API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/autoscalers/list}
   *
   * @param {object=} options - Autoscaler search options.
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
   * @param {number} options.maxResults - Maximum number of autoscalers to return.
   * @param {string} options.pageToken - A previously-returned page token
   *     representing part of the larger set of results to view.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {Autoscaler[]} callback.autoscalers - Autoscaler
   *     objects from your project.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   *
   * zone.getAutoscalers(function(err, autoscalers) {
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
   *     zone.getAutoscalers(nextQuery, callback);
   *   }
   * }
   *
   * zone.getAutoscalers({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * zone.getAutoscalers().then(function(data) {
   *   const autoscalers = data[0];
   * });
   */
  getAutoscalers(options, callback) {
    const self = this;
    if (is.fn(options)) {
      callback = options;
      options = {};
    }
    options = options || {};
    this.request(
      {
        uri: '/autoscalers',
        qs: options,
      },
      function(err, resp) {
        if (err) {
          callback(err, null, null, resp);
          return;
        }
        let nextQuery = null;
        if (resp.nextPageToken) {
          nextQuery = Object.assign({}, options, {
            pageToken: resp.nextPageToken,
          });
        }
        const autoscalers = arrify(resp.items).map(function(autoscaler) {
          const autoscalerInstance = self.autoscaler(autoscaler.name);
          autoscalerInstance.metadata = autoscaler;
          return autoscalerInstance;
        });
        callback(null, autoscalers, nextQuery, resp);
      }
    );
  }
  /**
   *  Get a list of disks in this zone.
   *
   * @see [Disks Overview]{@link https://cloud.google.com/compute/docs/disks}
   * @see [Disks: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/disks/list}
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
   * @param {Disk[]} callback.disks - Disk objects from this zone.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   *
   * zone.getDisks(function(err, disks) {
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
   *     zone.getDisks(nextQuery, callback);
   *   }
   * }
   *
   * zone.getDisks({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * zone.getDisks().then(function(data) {
   *   const disks = data[0];
   * });
   */
  getDisks(options, callback) {
    const self = this;
    if (is.fn(options)) {
      callback = options;
      options = {};
    }
    options = options || {};
    this.request(
      {
        uri: '/disks',
        qs: options,
      },
      function(err, resp) {
        if (err) {
          callback(err, null, null, resp);
          return;
        }
        let nextQuery = null;
        if (resp.nextPageToken) {
          nextQuery = Object.assign({}, options, {
            pageToken: resp.nextPageToken,
          });
        }
        const disks = (resp.items || []).map(function(disk) {
          const diskInstance = self.disk(disk.name);
          diskInstance.metadata = disk;
          return diskInstance;
        });
        callback(null, disks, nextQuery, resp);
      }
    );
  }
  /**
   * Get a list of instance groups for this zone.
   *
   * @see [InstanceGroups Overview]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroups}
   * @see [InstanceGroups: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroups/list}
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
   *     InstanceGroup objects from this zone.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   *
   * zone.getInstanceGroups(function(err, instanceGroups) {
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
   *     zone.getInstanceGroups(nextQuery, callback);
   *   }
   * }
   *
   * zone.getInstanceGroups({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * zone.getInstanceGroups().then(function(data) {
   *   const instanceGroups = data[0];
   * });
   */
  getInstanceGroups(options, callback) {
    const self = this;
    if (is.fn(options)) {
      callback = options;
      options = {};
    }
    options = options || {};
    this.request(
      {
        uri: '/instanceGroups',
        qs: options,
      },
      function(err, resp) {
        if (err) {
          callback(err, null, null, resp);
          return;
        }
        let nextQuery = null;
        if (resp.nextPageToken) {
          nextQuery = Object.assign({}, options, {
            pageToken: resp.nextPageToken,
          });
        }
        const instanceGroups = (resp.items || []).map(function(instanceGroup) {
          const instanceGroupInstance = self.instanceGroup(instanceGroup.name);
          instanceGroupInstance.metadata = instanceGroup;
          return instanceGroupInstance;
        });
        callback(null, instanceGroups, nextQuery, resp);
      }
    );
  }
  /**
   * Get a list of instance group managers for this zone.
   *
   * @see [InstanceGroupManagers Overview]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroupManagers}
   * @see [InstanceGroupManagers: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroupManagers/list}
   *
   * @param {object=} options - Instance group manager search options.
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
   * @param {InstanceGroupManager[]} callback.instanceGroupManagers -
   *     InstanceGroupManager objects from this zone.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   *
   * zone.getInstanceGroupManagers(function(err, instanceGroupManagers) {
   *   // `instanceGroupManagers` is an array of `InstanceGroupManager` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, instanceGroupManagers, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     zone.getInstanceGroupManagers(nextQuery, callback);
   *   }
   * }
   *
   * zone.getInstanceGroupManagers({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * zone.getInstanceGroupManagers().then(function(data) {
   *   const instanceGroupManagerss = data[0];
   * });
   */
  getInstanceGroupManagers(options, callback) {
    const self = this;
    if (is.fn(options)) {
      callback = options;
      options = {};
    }
    options = options || {};
    this.request(
      {
        uri: '/instanceGroupManagers',
        qs: options,
      },
      function(err, resp) {
        if (err) {
          callback(err, null, null, resp);
          return;
        }
        let nextQuery = null;
        if (resp.nextPageToken) {
          nextQuery = Object.assign({}, options, {
            pageToken: resp.nextPageToken,
          });
        }
        const instanceGroupManagers = (resp.items || []).map(function(
          instanceGroupManager
        ) {
          const instanceGroupManagerInstance = self.instanceGroupManager(
            instanceGroupManager.name
          );
          instanceGroupManagerInstance.metadata = instanceGroupManager;
          return instanceGroupManagerInstance;
        });
        callback(null, instanceGroupManagers, nextQuery, resp);
      }
    );
  }
  /**
   * Get a list of machine types for this zone.
   *
   * @see [MachineTypes: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/machineTypes/list}
   * @see [Machine Types Overview]{@link https://cloud.google.com/compute/docs/machine-types}
   * @see [MachineType Resource]{@link https://cloud.google.com/compute/docs/reference/v1/machineTypes}
   *
   * @param {object=} options - Machine type search options.
   * @param {boolean} options.autoPaginate - Have pagination handled
   *     automatically. Default: true.
   * @param {number} options.maxApiCalls - Maximum number of API calls to make.
   * @param {number} options.maxResults - Maximum number of machineTypes
   *     to return.
   * @param {string} options.pageToken - A previously-returned page token
   *     representing part of the larger set of results to view.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {MachineType[]} callback.machineTypes - MachineType
   *     objects from this zone.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   *
   * zone.getMachineTypes(function(err, machineTypes) {
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
   *     zone.getMachineTypes(nextQuery, callback);
   *   }
   * }
   *
   * zone.getMachineTypes({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * zone.getMachineTypes().then(function(data) {
   *   const machineTypes = data[0];
   * });
   */
  getMachineTypes(options, callback) {
    if (is.fn(options)) {
      callback = options;
      options = {};
    }
    options = Object.assign({}, options, {
      filter: 'zone eq .*' + this.name,
    });
    return this.compute.getMachineTypes(options, callback);
  }
  /**
   * Get a list of operations for this zone.
   *
   * @see [Zone Operation Overview]{@link https://cloud.google.com/compute/docs/reference/v1/zoneOperations}
   * @see [ZoneOperations: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/zoneOperations/list}
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
   *     from this zone.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   *
   * zone.getOperations(function(err, operations) {
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
   *     zone.getOperations(nextQuery, callback);
   *   }
   * }
   *
   * zone.getOperations({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * zone.getOperations().then(function(data) {
   *   const operations = data[0];
   * });
   */
  getOperations(options, callback) {
    const self = this;
    if (is.fn(options)) {
      callback = options;
      options = {};
    }
    options = options || {};
    this.request(
      {
        uri: '/operations',
        qs: options,
      },
      function(err, resp) {
        if (err) {
          callback(err, null, null, resp);
          return;
        }
        let nextQuery = null;
        if (resp.nextPageToken) {
          nextQuery = Object.assign({}, options, {
            pageToken: resp.nextPageToken,
          });
        }
        const operations = (resp.items || []).map(function(operation) {
          const operationInstance = self.operation(operation.name);
          operationInstance.metadata = operation;
          return operationInstance;
        });
        callback(null, operations, nextQuery, resp);
      }
    );
  }
  /**
   * Get a list of VM instances in this zone.
   *
   * @see [Instances and Networks]{@link https://cloud.google.com/compute/docs/instances-and-network}
   * @see [Instances: list API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/list}
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
   * @param {string} options.pageToken - A previously-returned page token
   *     representing part of the larger set of results to view.
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - An error returned while making this request.
   * @param {VM[]} callback.vms - VM objects from this zone.
   * @param {object} callback.apiResponse - The full API response.
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   *
   * zone.getVMs(function(err, vms) {
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
   *     zone.getVMs(nextQuery, callback);
   *   }
   * }
   *
   * zone.getVMs({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * zone.getVMs().then(function(data) {
   *   const vms = data[0];
   * });
   */
  getVMs(options, callback) {
    const self = this;
    if (is.fn(options)) {
      callback = options;
      options = {};
    }
    options = options || {};
    this.request(
      {
        uri: '/instances',
        qs: options,
      },
      function(err, resp) {
        if (err) {
          callback(err, null, null, resp);
          return;
        }
        let nextQuery = null;
        if (resp.nextPageToken) {
          nextQuery = Object.assign({}, options, {
            pageToken: resp.nextPageToken,
          });
        }
        const vms = (resp.items || []).map(function(instance) {
          const vmInstance = self.vm(instance.name);
          vmInstance.metadata = instance;
          return vmInstance;
        });
        callback(null, vms, nextQuery, resp);
      }
    );
  }
  /**
   * Get a reference to a Google Compute Engine instance group.
   *
   * @see [InstanceGroups Overview]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroups}
   *
   * @param {string} name - Name of the existing instance group.
   * @returns {InstanceGroup}
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   *
   * const instanceGroup = zone.instanceGroup('my-instance-group');
   */
  instanceGroup(name) {
    return new InstanceGroup(this, name);
  }
  /**
   * Get a reference to a Google Compute Engine instance group manager.
   *
   * @see [InstanceGroupManagers Overview]{@link https://cloud.google.com/compute/docs/reference/v1/instanceGroupManagers}
   *
   * @param {string} name - Name of the existing instance group manager.
   * @returns {InstanceGroupManager}
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   *
   * const instanceGroupManager = zone.instanceGroupManager('my-instance-group-manager');
   */
  instanceGroupManager(name) {
    return new InstanceGroupManager(this, name);
  }
  /**
   * Get a reference to a Google Compute Engine machine type.
   *
   * @see [Machine Types Overview]{@link https://cloud.google.com/compute/docs/machine-types}
   * @see [MachineType Resource]{@link https://cloud.google.com/compute/docs/reference/v1/machineTypes}
   *
   * @param {string} name - Name of the existing machine type.
   * @returns {MachineType}
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   *
   * const machineType = zone.machineType('g1-small');
   */
  machineType(name) {
    return new MachineType(this, name);
  }
  /**
   * Get a reference to a Google Compute Engine zone operation.
   *
   * @see [Zone Operation Overview]{@link https://cloud.google.com/compute/docs/reference/v1/zoneOperations}
   *
   * @param {string} name - Name of the existing operation.
   * @returns {Operation}
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   *
   * const operation = zone.operation('operation-1445532685163-8b137d2a-1822afe7');
   */
  operation(name) {
    return new Operation(this, name);
  }
  /**
   * Get a reference to a Google Compute Engine virtual machine instance.
   *
   * @see [Instances and Networks]{@link https://cloud.google.com/compute/docs/instances-and-network}
   *
   * @param {string} name - Name of the virtual machine.
   * @returns {VM}
   *
   * @example
   * const Compute = require('@google-cloud/compute');
   * const compute = new Compute();
   * const zone = compute.zone('us-central1-a');
   *
   * const vm = zone.vm('vm-name');
   */
  vm(name) {
    return new VM(this, name);
  }
  /**
   * This method attempts to create a firewall rule to allow tcp:80 connections.
   *
   * @private
   *
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - If the firewall couldn't be created and it
   *     didn't already exist.
   */
  createHttpServerFirewall_(callback) {
    this.compute.createFirewall(
      'default-allow-http',
      {
        protocols: {
          tcp: [80],
        },
        ranges: ['0.0.0.0/0'],
        tags: ['http-server'],
      },
      function(err) {
        // If it already exists, we're all good.
        callback(err && err.code !== 409 ? err : null);
      }
    );
  }
  /**
   * This method attempts to create a firewall rule to allow tcp:443 connections.
   *
   * @private
   *
   * @param {function} callback - The callback function.
   * @param {?error} callback.err - If the firewall couldn't be created and it
   *     didn't already exist.
   */
  createHttpsServerFirewall_(callback) {
    this.compute.createFirewall(
      'default-allow-https',
      {
        protocols: {
          tcp: [443],
        },
        ranges: ['0.0.0.0/0'],
        tags: ['https-server'],
      },
      function(err) {
        // If it already exists, we're all good.
        callback(err && err.code !== 409 ? err : null);
      }
    );
  }
}

/**
 * Get a list of {@link Autoscaler} objects from this zone as a
 * readable object stream.
 *
 * @param {object=} options - Configuration object. See
 *     {@link Zone#getAutoscalers} for a complete list of options.
 * @returns {stream}
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('us-central1-a');
 *
 * zone.getAutoscalersStream()
 *   .on('error', console.error)
 *   .on('data', function(autoscaler) {
 *     // `autoscaler` is an `Autoscaler` object.
 *   })
 *   .on('end', function() {
 *     // All autoscalers retrieved.
 *   });
 *
 * //-
 * // If you anticipate many results, you can end a stream early to prevent
 * // unnecessary processing and API requests.
 * //-
 * zone.getAutoscalersStream()
 *   .on('data', function(autoscaler) {
 *     this.end();
 *   });
 */
Zone.prototype.getAutoscalersStream = paginator.streamify('getAutoscalers');

/**
 * Get a list of {@link Disk} objects in this zone as a readable object
 * stream.
 *
 * @param {object=} options - Configuration object. See
 *     {@link Zone#getDisks} for a complete list of options.
 * @returns {stream}
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('us-central1-a');
 *
 * zone.getDisksStream()
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
 * zone.getDisksStream()
 *   .on('data', function(disk) {
 *     this.end();
 *   });
 */
Zone.prototype.getDisksStream = paginator.streamify('getDisks');

/**
 * Get a list of {@link InstanceGroup} objects for this zone as a
 * readable object stream.
 *
 * @param {object=} options - Configuration object. See
 *     {@link Zone#getInstanceGroups} for a complete list of options.
 * @returns {stream}
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('us-central1-a');
 *
 * zone.getInstanceGroupsStream()
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
 * zone.getInstanceGroupsStream()
 *   .on('data', function(instanceGroup) {
 *     this.end();
 *   });
 */
Zone.prototype.getInstanceGroupsStream = paginator.streamify(
  'getInstanceGroups'
);

/**
 * Get a list of {@link MachineType} objects for this zone as a
 * readable object stream.
 *
 * @param {object=} options - Configuration object. See
 *     {@link Zone#getMachineTypes} for a complete list of options.
 * @returns {stream}
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('us-central1-a');
 *
 * zone.getMachineTypesStream()
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
 * zone.getMachineTypesStream()
 *   .on('data', function(machineType) {
 *     this.end();
 *   });
 */
Zone.prototype.getMachineTypesStream = paginator.streamify('getMachineTypes');

/**
 * Get a list of {@link Operation} objects for this zone as a readable
 * object stream.
 *
 * @param {object=} options - Configuration object. See
 *     {@link Zone#getOperations} for a complete list of options.
 * @returns {stream}
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('us-central1-a');
 *
 * zone.getOperationsStream()
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
 * zone.getOperationsStream()
 *   .on('data', function(operation) {
 *     this.end();
 *   });
 */
Zone.prototype.getOperationsStream = paginator.streamify('getOperations');

/**
 * Get a list of {@link VM} instances in this zone as a readable object
 * stream.
 *
 * @param {object=} options - Configuration object. See
 *     {@link Zone#getVMs} for a complete list of options.
 * @returns {stream}
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('us-central1-a');
 *
 * zone.getVMsStream()
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
 * zone.getVMsStream()
 *   .on('data', function(vm) {
 *     this.end();
 *   });
 */
Zone.prototype.getVMsStream = paginator.streamify('getVMs');

/*! Developer Documentation
 *
 * These methods can be auto-paginated.
 */
paginator.extend(Zone, [
  'getAutoscalers',
  'getDisks',
  'getInstanceGroups',
  'getInstanceGroupManagers',
  'getMachineTypes',
  'getOperations',
  'getVMs',
]);

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(Zone, {
  exclude: [
    'autoscaler',
    'disk',
    'instanceGroup',
    'instanceGroupManager',
    'machineType',
    'operation',
    'vm',
  ],
});

/**
 * Reference to the {@link Zone} class.
 * @name module:@google-cloud/compute.Zone
 * @see Zone
 */
module.exports = Zone;
