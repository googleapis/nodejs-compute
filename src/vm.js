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

var common = require('@google-cloud/common');
var createErrorClass = require('create-error-class');
var extend = require('extend');
var format = require('string-format-obj');
var is = require('is');
var util = require('util');

var Disk = require('./disk.js');

/**
 * Custom error type for errors related to detaching a disk.
 *
 * @private
 *
 * @param {string} message - Custom error message.
 * @returns {Error}
 */
var DetachDiskError = createErrorClass('DetachDiskError');

/**
 * Custom error type for when `waitFor()` does not return a status in a timely
 * fashion.
 *
 * @private
 *
 * @param {string} message - Custom error message.
 * @returns {Error}
 */
var WaitForTimeoutError = createErrorClass('WaitForTimeoutError');

/**
 * The statuses that a VM can be in.
 *
 * @private
 */
var VALID_STATUSES = [
  'PROVISIONING',
  'STAGING',
  'RUNNING',
  'STOPPING',
  'SUSPENDING',
  'SUSPENDED',
  'TERMINATED',
];

/**
 * Interval for polling during waitFor.
 *
 * @private
 */
var WAIT_FOR_POLLING_INTERVAL_MS = 2000;

/**
 * An Instance object allows you to interact with a Google Compute Engine
 * instance.
 *
 * @see [Instances and Networks]{@link https://cloud.google.com/compute/docs/instances-and-network}
 * @see [Instance Resource]{@link https://cloud.google.com/compute/docs/reference/v1/instances}
 *
 * @class
 * @param {Zone} zone - Zone object this instance belongs to.
 * @param {string} name - Name of the instance.
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('zone-name');
 * const vm = zone.vm('vm-name');
 */
function VM(zone, name) {
  /**
   * @name VM#name
   * @type {string}
   */
  this.name = name.replace(/.*\/([^/]+)$/, '$1'); // Just the instance name.
  /**
   * The parent {@link Zone} instance of this {@link VM} instance.
   * @name VM#zone
   * @type {Zone}
   */
  this.zone = zone;

  this.hasActiveWaiters = false;
  this.waiters = [];

  this.url = format('{base}/{project}/zones/{zone}/instances/{name}', {
    base: 'https://www.googleapis.com/compute/v1/projects',
    project: zone.compute.projectId,
    zone: zone.name,
    name: this.name,
  });

  var methods = {
    /**
     * Create a virtual machine.
     *
     * @method VM#create
     * @param {object} config - See {Zone#createVM}.
     *
     * @example
     * const Compute = require('@google-cloud/compute');
     * const compute = new Compute();
     * const zone = compute.zone('zone-name');
     * const vm = zone.vm('vm-name');
     *
     * const config = {
     *   // ...
     * };
     *
     * vm.create(config, function(err, vm, operation, apiResponse) {
     *   // `vm` is a VM object.
     *
     *   // `operation` is an Operation object that can be used to check the
     *   // status of the request.
     * });
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * vm.create(config).then(function(data) {
     *   const vm = data[0];
     *   const operation = data[1];
     *   const apiResponse = data[2];
     * });
     */
    create: true,

    /**
     * Check if the vm exists.
     *
     * @method VM#exists
     * @param {function} callback - The callback function.
     * @param {?error} callback.err - An error returned while making this
     *     request.
     * @param {boolean} callback.exists - Whether the vm exists or not.
     *
     * @example
     * const Compute = require('@google-cloud/compute');
     * const compute = new Compute();
     * const zone = compute.zone('zone-name');
     * const vm = zone.vm('vm-name');
     *
     * vm.exists(function(err, exists) {});
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * vm.exists().then(function(data) {
     *   const exists = data[0];
     * });
     */
    exists: true,

    /**
     * Get a virtual machine if it exists.
     *
     * You may optionally use this to "get or create" an object by providing an
     * object with `autoCreate` set to `true`. Any extra configuration that is
     * normally required for the `create` method must be contained within this
     * object as well.
     *
     * @method VM#get
     * @param {options=} options - Configuration object.
     * @param {boolean} options.autoCreate - Automatically create the object if
     *     it does not exist. Default: `false`
     *
     * @example
     * const Compute = require('@google-cloud/compute');
     * const compute = new Compute();
     * const zone = compute.zone('zone-name');
     * const vm = zone.vm('vm-name');
     *
     * vm.get(function(err, vm, apiResponse) {
     *   // `vm` is a VM object.
     * });
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * vm.get().then(function(data) {
     *   const vm = data[0];
     *   const apiResponse = data[1];
     * });
     */
    get: true,

    /**
     * Get the instance's metadata.
     *
     * @see [Instance Resource]{@link https://cloud.google.com/compute/docs/reference/v1/instances}
     * @see [Instance: get API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/get}
     *
     * @method VM#getMetadata
     * @param {function=} callback - The callback function.
     * @param {?error} callback.err - An error returned while making this
     *     request.
     * @param {object} callback.metadata - The instance's metadata.
     * @param {object} callback.apiResponse - The full API response.
     *
     * @example
     * const Compute = require('@google-cloud/compute');
     * const compute = new Compute();
     * const zone = compute.zone('zone-name');
     * const vm = zone.vm('vm-name');
     *
     * vm.getMetadata(function(err, metadata, apiResponse) {});
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * vm.getMetadata().then(function(data) {
     *   const metadata = data[0];
     *   const apiResponse = data[1];
     * });
     */
    getMetadata: true,
  };

  common.ServiceObject.call(this, {
    parent: zone,
    baseUrl: '/instances',
    /**
     * @name VM#id
     * @type {string}
     */
    id: this.name,
    createMethod: zone.createVM.bind(zone),
    methods: methods,
  });
}

util.inherits(VM, common.ServiceObject);

/**
 * Attach a disk to the instance.
 *
 * @see [Disks Overview]{@link https://cloud.google.com/compute/docs/disks}
 * @see [Disk Resource]{@link https://cloud.google.com/compute/docs/reference/v1/disks}
 * @see [Instance: attachDisk API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/attachDisk}
 *
 * @throws {Error} if a {module:compute/disk} is not provided.
 *
 * @param {module:compute/disk} disk - The disk to attach.
 * @param {object=} options - See the
 *     [Instances: attachDisk](https://cloud.google.com/compute/docs/reference/v1/instances/attachDisk)
 *     request body.
 * @param {boolean} options.readOnly - Attach the disk in read-only mode. (Alias
 *     for `options.mode = READ_ONLY`)
 * @param {function} callback - The callback function.
 * @param {?error} callback.err - An error returned while making this request.
 * @param {Operation} callback.operation - An operation object
 *     that can be used to check the status of the request.
 * @param {object} callback.apiResponse - The full API response.
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('zone-name');
 * const vm = zone.vm('vm-name');
 *
 * const disk = zone.disk('my-disk');
 *
 * function callback(err, operation, apiResponse) {
 *   // `operation` is an Operation object that can be used to check the status
 *   // of the request.
 * }
 *
 * vm.attachDisk(disk, callback);
 *
 * //-
 * // Provide an options object to customize the request.
 * //-
 * const options = {
 *   autoDelete: true,
 *   readOnly: true
 * };
 *
 * vm.attachDisk(disk, options, callback);
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * vm.attachDisk(disk, options).then(function(data) {
 *   const operation = data[0];
 *   const apiResponse = data[1];
 * });
 */
VM.prototype.attachDisk = function(disk, options, callback) {
  if (!(disk instanceof Disk)) {
    throw new Error('A Disk object must be provided.');
  }

  if (is.fn(options)) {
    callback = options;
    options = {};
  }

  var body = extend(
    {
      // Default the deviceName to the name of the disk, like the Console does.
      deviceName: disk.name,
    },
    options,
    {
      source: disk.formattedName,
    }
  );

  if (body.readOnly) {
    body.mode = 'READ_ONLY';
    delete body.readOnly;
  }

  this.request(
    {
      method: 'POST',
      uri: '/attachDisk',
      json: body,
    },
    callback
  );
};

/**
 * Delete the instance.
 *
 * @see [Instance: delete API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/delete}
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
 * const zone = compute.zone('zone-name');
 * const vm = zone.vm('vm-name');
 *
 * vm.delete(function(err, operation, apiResponse) {
 *   // `operation` is an Operation object that can be used to check the status
 *   // of the request.
 * });
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * vm.delete().then(function(data) {
 *   const operation = data[0];
 *   const apiResponse = data[1];
 * });
 */
VM.prototype.delete = function(callback) {
  this.request(
    {
      method: 'DELETE',
      uri: '',
    },
    callback || common.util.noop
  );
};

/**
 * Detach a disk from the instance.
 *
 * @see [Instance: detachDisk API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/detachDisk}
 *
 * @param {module:compute/disk|string} deviceName - The device name of the disk
 *     to detach. If a Disk object is provided, we try to find the device name
 *     automatically by searching through the attached disks on the instance.
 * @param {function=} callback - The callback function.
 * @param {?error} callback.err - An error returned while making this request.
 * @param {Operation} callback.operation - An operation object
 *     that can be used to check the status of the request.
 * @param {object} callback.apiResponse - The full API response.
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('zone-name');
 * const vm = zone.vm('vm-name');
 *
 * const disk = zone.disk('my-disk');
 *
 * vm.detachDisk(disk, function(err, operation, apiResponse) {
 *   // `operation` is an Operation object that can be used to check the status
 *   // of the request.
 * });
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * vm.detachDisk(disk).then(function(data) {
 *   const operation = data[0];
 *   const apiResponse = data[1];
 * });
 */
VM.prototype.detachDisk = function(disk, callback) {
  var self = this;

  if (!(disk instanceof Disk)) {
    throw new Error('A Disk object must be provided.');
  }

  this.getMetadata(function(err, metadata) {
    if (err) {
      callback(new DetachDiskError(err.message));
      return;
    }

    var diskName = common.util.replaceProjectIdToken(
      disk.formattedName,
      self.zone.compute.authClient.projectId
    );

    var deviceName;
    var baseUrl = 'https://www.googleapis.com/compute/v1/';
    var disks = metadata.disks || [];

    // Try to find the deviceName by matching the source of the attached disks
    // to the name of the disk provided by the user.
    for (var i = 0; !deviceName && i < disks.length; i++) {
      var attachedDisk = disks[i];
      var source = attachedDisk.source.replace(baseUrl, '');

      if (source === diskName) {
        deviceName = attachedDisk.deviceName;
      }
    }

    if (!deviceName) {
      callback(new DetachDiskError('Device name for this disk was not found.'));
      return;
    }

    self.request(
      {
        method: 'POST',
        uri: '/detachDisk',
        qs: {
          deviceName: deviceName,
        },
      },
      callback || common.util.noop
    );
  });
};

/**
 * Returns the serial port output for the instance.
 *
 * @see [Instances: getSerialPortOutput API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/getSerialPortOutput}
 *
 * @param {number=} port - The port from which the output is retrieved (1-4).
 *    Default: `1`.
 * @param {function} callback - The callback function.
 * @param {?error} callback.err - An error returned while making this request.
 * @param {object} callback.output - The output from the port.
 * @param {object} callback.apiResponse - The full API response.
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('zone-name');
 * const vm = zone.vm('vm-name');
 *
 * vm.getSerialPortOutput(function(err, output, apiResponse) {});
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * vm.getSerialPortOutput().then(function(data) {
 *   const output = data[0];
 *   const apiResponse = data[1];
 * });
 */
VM.prototype.getSerialPortOutput = function(port, callback) {
  if (is.fn(port)) {
    callback = port;
    port = 1;
  }

  var reqOpts = {
    uri: '/serialPort',
    qs: {
      port: port,
    },
  };

  var request = common.ServiceObject.prototype.request;

  request.call(this, reqOpts, function(err, resp) {
    if (err) {
      callback(err, null, resp);
      return;
    }

    callback(null, resp.contents, resp);
  });
};

/**
 * Get the instance's tags and their fingerprint.
 *
 * This method wraps {module:compute/vm#getMetadata}, returning only the `tags`
 * property.
 *
 * @param {function} callback - The callback function.
 * @param {?error} callback.err - An error returned while making this request.
 * @param {object[]} callback.tags - Tag objects from this VM.
 * @param {string} callback.fingerprint - The current tag fingerprint.
 * @param {object} callback.apiResponse - The full API response.
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('zone-name');
 * const vm = zone.vm('vm-name');
 *
 * vm.getTags(function(err, tags, fingerprint, apiResponse) {});
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * vm.getTags().then(function(data) {
 *   const tags = data[0];
 *   const fingerprint = data[1];
 *   const apiResponse = data[2];
 * });
 */
VM.prototype.getTags = function(callback) {
  this.getMetadata(function(err, metadata, apiResponse) {
    if (err) {
      callback(err, null, null, apiResponse);
      return;
    }

    callback(null, metadata.tags.items, metadata.tags.fingerprint, apiResponse);
  });
};

/**
 * Reset the instance.
 *
 * @see [Instances: reset API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/reset}
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
 * const zone = compute.zone('zone-name');
 * const vm = zone.vm('vm-name');
 *
 * vm.reset(function(err, operation, apiResponse) {
 *   // `operation` is an Operation object that can be used to check the status
 *   // of the request.
 * });
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * vm.reset().then(function(data) {
 *   const operation = data[0];
 *   const apiResponse = data[1];
 * });
 */
VM.prototype.reset = function(callback) {
  this.request(
    {
      method: 'POST',
      uri: '/reset',
    },
    callback || common.util.noop
  );
};

/**
 * Set the machine type for this instance, **stopping and restarting the VM as
 * necessary**.
 *
 * For a list of the standard, high-memory, and high-CPU machines you may choose
 * from, see
 * [Predefined machine types]{@link https://cloud.google.com/compute/docs/machine-types#predefined_machine_types}.
 *
 * In order to change the machine type, the VM must not be running. This method
 * will automatically stop the VM if it is running before changing the machine
 * type. After it is sucessfully changed, the VM will be started.
 *
 * @see [Instances: setMachineType API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/setMachineType}
 * @see [Predefined machine types]{@link https://cloud.google.com/compute/docs/machine-types#predefined_machine_types}
 *
 * @param {string} machineType - Full or partial machine type. See a list of
 *     predefined machine types
 *     [here](https://cloud.google.com/compute/docs/machine-types#predefined_machine_types).
 * @param {object=} options - Configuration object.
 * @param {boolean} options.start - Start the VM after successfully updating the
 *     machine type. Default: `false`.
 * @param {function} callback - The callback function.
 * @param {?error} callback.err - An error returned while making this request.
 * @param {object} callback.apiResponse - The full API response.
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('zone-name');
 * const vm = zone.vm('vm-name');
 *
 * vm.resize('n1-standard-1', function(err, apiResponse) {
 *   if (!err) {
 *     // The VM is running and its machine type was changed successfully.
 *   }
 * });
 *
 * //-
 * // By default, calling `resize` will start your server after updating its
 * // machine type. If you want to leave it stopped, set `options.start` to
 * // `false`.
 * //-
 * const options = {
 *   start: false
 * };
 *
 * vm.resize('ns-standard-1', options, function(err, apiResponse) {
 *   if (!err) {
 *     // The VM is stopped and its machine type was changed successfully.
 *   }
 * });
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * vm.resize('ns-standard-1', options).then(function(data) {
 *   const apiResponse = data[0];
 * });
 */
VM.prototype.resize = function(machineType, options, callback) {
  var self = this;
  var compute = this.zone.parent;

  if (is.fn(options)) {
    callback = options;
    options = {};
  }

  options = options || {};

  var isPartialMachineType = machineType.indexOf('/') === -1;

  if (isPartialMachineType) {
    machineType = format('zones/{zoneName}/machineTypes/{machineType}', {
      zoneName: this.zone.name,
      machineType: machineType,
    });
  }

  this.request(
    {
      method: 'POST',
      uri: '/setMachineType',
      json: {
        machineType: machineType,
      },
    },
    compute.execAfterOperation_(function(err, apiResponse) {
      if (err) {
        if (err.message === 'Instance is starting or running.') {
          // The instance must be stopped before its machine type can be set.
          self.stop(
            compute.execAfterOperation_(function(err, apiResponse) {
              if (err) {
                callback(err, apiResponse);
                return;
              }

              // Try again now that the instance is stopped.
              self.resize(machineType, callback);
            })
          );
        } else {
          callback(err, apiResponse);
        }
        return;
      }

      // The machine type was changed successfully.
      if (options.start === false) {
        callback(null, apiResponse);
      } else {
        self.start(compute.execAfterOperation_(callback));
      }
    })
  );
};

/**
 * Set the metadata for this instance.
 *
 * @see [Instances: setMetadata API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/setMetadata}
 *
 * @param {object} metadata - New metadata.
 * @param {function=} callback - The callback function.
 * @param {?error} callback.err - An error returned while making this request.
 * @param {Operation} callback.operation - An operation object
 *     that can be used to check the status of the request.
 * @param {object} callback.apiResponse - The full API response.
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('zone-name');
 * const vm = zone.vm('vm-name');
 *
 * const metadata = {
 *   'startup-script': '...'
 * };
 *
 * vm.setMetadata(metadata, function(err, operation, apiResponse) {
 *   // `operation` is an Operation object that can be used to check the status
 *   // of the request.
 * });
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * vm.setMetadata(metadata).then(function(data) {
 *   const operation = data[0];
 *   const apiResponse = data[1];
 * });
 */
VM.prototype.setMetadata = function(metadata, callback) {
  var self = this;

  callback = callback || common.util.noop;

  this.getMetadata(function(err, currentMetadata, apiResponse) {
    if (err) {
      callback(err, null, apiResponse);
      return;
    }

    var newMetadata = {
      fingerprint: currentMetadata.metadata.fingerprint,
      items: [],
    };

    for (var prop in metadata) {
      if (metadata.hasOwnProperty(prop)) {
        newMetadata.items.push({
          key: prop,
          value: metadata[prop],
        });
      }
    }

    self.request(
      {
        method: 'POST',
        uri: '/setMetadata',
        json: newMetadata,
      },
      callback
    );
  });
};

/**
 * Set the instance's tags.
 *
 * @see [Instances: setTags API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/setTags}
 *
 * @param {string[]} tags - The new tags for the instance.
 * @param {string} fingerprint - The current tags fingerprint. An up-to-date
 *     fingerprint must be provided.
 * @param {function=} callback - The callback function.
 * @param {?error} callback.err - An error returned while making this request.
 * @param {Operation} callback.operation - An operation object
 *     that can be used to check the status of the request.
 * @param {object} callback.apiResponse - The full API response.
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('zone-name');
 * const vm = zone.vm('vm-name');
 *
 * vm.getTags(function(err, tags, fingerprint) {
 *   tags.push('new-tag');
 *
 *  vm.setTags(tags, fingerprint, function(err, operation, apiResponse) {
 *     // `operation` is an Operation object that can be used to check the
 *     //  status of the request.
 *   });
 * });
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * vm.getTags().then(function(data) {
 *   const tags = data[0];
 *   const fingerprint = data[1];
 *
 *   tags.push('new-tag');
 *
 *   return vm.setTags(tags, fingerprint);
 * }).then(function(data) {
 *   const operation = data[0];
 *   const apiResponse = data[1];
 * });
 */
VM.prototype.setTags = function(tags, fingerprint, callback) {
  var body = {
    items: tags,
    fingerprint: fingerprint,
  };

  this.request(
    {
      method: 'POST',
      uri: '/setTags',
      json: body,
    },
    callback || common.util.noop
  );
};

/**
 * Start the instance.
 *
 * @see [Instances: start API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/start}
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
 * const zone = compute.zone('zone-name');
 * const vm = zone.vm('vm-name');
 *
 * vm.start(function(err, operation, apiResponse) {
 *   // `operation` is an Operation object that can be used to check the status
 *   // of the request.
 * });
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * vm.start().then(function(data) {
 *   const operation = data[0];
 *   const apiResponse = data[1];
 * });
 */
VM.prototype.start = function(callback) {
  this.request(
    {
      method: 'POST',
      uri: '/start',
    },
    callback || common.util.noop
  );
};

/**
 * Stop the instance.
 *
 * @see [Instances: stop API Documentation]{@link https://cloud.google.com/compute/docs/reference/v1/instances/stop}
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
 * const zone = compute.zone('zone-name');
 * const vm = zone.vm('vm-name');
 *
 * vm.stop(function(err, operation, apiResponse) {
 *   // `operation` is an Operation object that can be used to check the status
 *   // of the request.
 * });
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * vm.stop().then(function(data) {
 *   const operation = data[0];
 *   const apiResponse = data[1];
 * });
 */
VM.prototype.stop = function(callback) {
  this.request(
    {
      method: 'POST',
      uri: '/stop',
    },
    callback || common.util.noop
  );
};

/**
 * This function will callback when the VM is in the specified state.
 *
 * Will time out after the specified time (default: 300 seconds).
 *
 * @param {string} status - The status to wait for. This can be:
 *     - "PROVISIONING"
 *     - "STAGING"
 *     - "RUNNING"
 *     - "STOPPING"
 *     - "SUSPENDING"
 *     - "SUSPENDED"
 *     - "TERMINATED"
 * @param {object=} options - Configuration object.
 * @param {number} options.timeout - The number of seconds to wait until timing
 *     out, between `0` and `600`. Default: `300`
 * @param {function} callback - The callback function.
 * @param {?error} callback.err - An error returned while waiting for the
 *     status.
 * @param {object} callback.metadata - The instance's metadata.
 *
 * @example
 * const Compute = require('@google-cloud/compute');
 * const compute = new Compute();
 * const zone = compute.zone('zone-name');
 * const vm = zone.vm('vm-name');
 *
 * vm.waitFor('RUNNING', function(err, metadata) {
 *   if (!err) {
 *     // The VM is running.
 *   }
 * });
 *
 * //-
 * // By default, `waitFor` will timeout after 300 seconds while waiting for the
 * // desired state to occur. This can be changed to any number between 0 and
 * // 600. If the timeout is set to 0, it will poll once for status and then
 * // timeout if the desired state is not reached.
 * //-
 * const options = {
 *   timeout: 600
 * };
 *
 * vm.waitFor('TERMINATED', options, function(err, metadata) {
 *   if (!err) {
 *     // The VM is terminated.
 *   }
 * });
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * vm.waitFor('RUNNING', options).then(function(data) {
 *   const metadata = data[0];
 * });
 */
VM.prototype.waitFor = function(status, options, callback) {
  if (is.fn(options)) {
    callback = options;
    options = {};
  }

  options = options || {};

  status = status.toUpperCase();

  // The timeout should default to five minutes, be less than or equal to 10
  // minutes, and be greater than or equal to 0 seconds.
  var timeout = 300;

  if (is.number(options.timeout)) {
    timeout = Math.min(Math.max(options.timeout, 0), 600);
  }

  if (VALID_STATUSES.indexOf(status) === -1) {
    throw new Error('Status passed to waitFor is invalid.');
  }

  this.waiters.push({
    status: status,
    timeout: timeout,
    startTime: new Date() / 1000,
    callback: callback,
  });

  if (!this.hasActiveWaiters) {
    this.hasActiveWaiters = true;
    this.startPolling_();
  }
};

/**
 * Poll `getMetadata` to check the VM's status. This runs a loop to ping
 * the API on an interval.
 *
 * Note: This method is automatically called when a `waitFor()` call
 * is made.
 *
 * @private
 */
VM.prototype.startPolling_ = function() {
  var self = this;

  if (!this.hasActiveWaiters) {
    return;
  }

  this.getMetadata(function(err, metadata) {
    var now = new Date() / 1000;

    var waitersToRemove = self.waiters.filter(function(waiter) {
      if (err) {
        waiter.callback(err);
        return true;
      }

      if (metadata.status === waiter.status) {
        waiter.callback(null, metadata);
        return true;
      }

      if (now - waiter.startTime >= waiter.timeout) {
        var waitForTimeoutError = new WaitForTimeoutError(
          [
            'waitFor timed out waiting for VM ' + self.name,
            'to be in status: ' + waiter.status,
          ].join(' ')
        );
        waiter.callback(waitForTimeoutError);
        return true;
      }
    });

    waitersToRemove.forEach(function(waiter) {
      self.waiters.splice(self.waiters.indexOf(waiter), 1);
    });

    self.hasActiveWaiters = self.waiters.length > 0;

    if (self.hasActiveWaiters) {
      setTimeout(self.startPolling_.bind(self), WAIT_FOR_POLLING_INTERVAL_MS);
    }
  });
};

/**
 * Make a new request object from the provided arguments and wrap the callback
 * to intercept non-successful responses.
 *
 * Most operations on a VM are long-running. This method handles building an
 * operation and returning it to the user's provided callback. In methods that
 * don't require an operation, we simply don't do anything with the `Operation`
 * object.
 *
 * @private
 *
 * @param {string} method - Action.
 * @param {string} path - Request path.
 * @param {*} query - Request query object.
 * @param {*} body - Request body contents.
 * @param {function} callback - The callback function.
 */
VM.prototype.request = function(reqOpts, callback) {
  var zone = this.zone;

  var request = common.ServiceObject.prototype.request;

  request.call(this, reqOpts, function(err, resp) {
    if (err) {
      callback(err, null, resp);
      return;
    }

    var operation = zone.operation(resp.name);
    operation.metadata = resp;

    callback(null, operation, resp);
  });
};

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
common.util.promisifyAll(VM);

module.exports = VM;
