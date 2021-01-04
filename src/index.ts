/*!
 * Copyright 2021 Google Inc. All Rights Reserved.
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
import {Compute} from './compute';

export {Firewall} from './firewall';
export {HealthCheck} from './health-check';
export {Image} from './image';
export {Network} from './network';
export {Operation} from './operation';
export {Project} from './project';
export {Region} from './region';
export {Rule} from './rule';
export {Service} from './service';
export {Snapshot} from './snapshot';
export {Zone} from './zone';

export type {Address, CreateAddressOptions} from './address';
export type {Autoscaler, CreateAutoscalerOptions} from './autoscaler';
export type {ClientConfig} from './compute';
export type {
  CreateDiskOptions,
  CreateDiskOptions2,
  CreateSnapshotOptions,
  Disk,
} from './disk';
export type {CreateFirewallOptions, FirewallRule} from './firewall';
export type {
  CreateHealthCheckOptions,
  GetHealthChecksOptions,
} from './health-check';
export type {CreateImageOptions, Key} from './image';
export type {
  CreateInstanceGroupOptions,
  GetVMsOptions,
  InstanceGroup,
} from './instance-group';
export type {InstanceGroupManager} from './instance-group-manager';
export type {
  BaseOptions,
  CryptKey,
  GetResourcesCallback,
  GetResourcesOptions,
  GetResourcesPromise,
  GetResourcesStream,
  GuestOsFeatures,
  IPVersion,
  Labeled,
  MetadataCallback,
  NetworkTier,
  Protocol,
} from './interfaces';
export type {MachineType} from './machine-type';
export type {CreateNetworkOptions} from './network';
export type {
  CreateResourceCallback,
  CreateResourcePromise,
  OperationCallback,
  OperationPromise,
} from './operation';
export type {CreateRuleOptions} from './rule';
export type {
  CreateServiceOptions,
  GetHealthCallback,
  GetHealthOptions,
  GetHealthPromise,
} from './service';
export type {CreateSubnetworkOptions, Subnetwork} from './subnetwork';
export type {
  Callback,
  CreateVMOptions,
  FingerprintedItemsPromise,
  GetFingerprintedItemsCallback,
  GetSerialPortOptions,
  GetSerialPortOutputCallback,
  ResizeOptions,
  SerialPortOutput,
  VM,
  WaitForOptions,
} from './vm';
export type {CreateDiskConfig} from './zone';

export {Compute};

export default Compute;
