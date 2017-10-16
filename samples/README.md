<img src="https://avatars2.githubusercontent.com/u/2810941?v=3&s=96" alt="Google Cloud Platform logo" title="Google Cloud Platform" align="right" height="96" width="96"/>

# Google Compute Engine: Node.js Samples

[![Build](https://storage.googleapis.com/.svg)]()

[Compute Engine](https://cloud.google.com/compute/docs/) lets you create and run virtual machines on Google infrastructure. Compute Engine offers scale, performance, and value that allows you to easily launch large compute clusters on Google&#x27;s infrastructure. There are no upfront investments and you can run thousands of virtual CPUs on a system that has been designed to be fast, and to offer strong consistency of performance.

## Table of Contents

* [Before you begin](#before-you-begin)
* [Samples](#samples)
  * [Virtual Machines](#virtual-machines)

## Before you begin

Before running the samples, make sure you've followed the steps in the
[Before you begin section](../README.md#before-you-begin) of the client
library's README.

## Samples

### Virtual Machines

View the [source code][vms_0_code].

__Usage:__ `node vms`

```
VMs: [ VM {
    name: 'cps-loadtest-cps-gcloud-java-publisher-4-jr70',
    zone: 
     Zone {
       metadata: {},
       baseUrl: '/zones',
       parent: [Object],
       id: 'us-central1-a',
       createMethod: undefined,
       methods: [Object],
       interceptors: [],
       Promise: [Function: Promise],
       create: undefined,
       delete: undefined,
       setMetadata: undefined,
       compute: [Object],
       name: 'us-central1-a',
       gceImages: [Object] },
    hasActiveWaiters: false,
    waiters: [],
    url: 'https://www.googleapis.com/compute/v1/projects/precise-truck-742/zones/us-central1-a/instances/cps-loadtest-cps-gcloud-java-publisher-4-jr70',
    metadata: 
     { kind: 'compute#instance',
       id: '1086719671248952220',
       creationTimestamp: '2017-08-16T13:05:08.617-07:00',
       name: 'cps-loadtest-cps-gcloud-java-publisher-4-jr70',
       tags: [Object],
       machineType: 'https://www.googleapis.com/compute/v1/projects/precise-truck-742/zones/us-central1-a/machineTypes/n1-standard-4',
       status: 'RUNNING',
       zone: 'https://www.googleapis.com/compute/v1/projects/precise-truck-742/zones/us-central1-a',
       networkInterfaces: [Array],
       disks: [Array],
       metadata: [Object],
       serviceAccounts: [Array],
       selfLink: 'https://www.googleapis.com/compute/v1/projects/precise-truck-742/zones/us-central1-a/instances/cps-loadtest-cps-gcloud-java-publisher-4-jr70',
       scheduling: [Object],
       cpuPlatform: 'Intel Sandy Bridge',
       labelFingerprint: '42WmSpB8rSM=',
       startRestricted: false },
    baseUrl: '/instances',
    parent: 
     Zone {
       metadata: {},
       baseUrl: '/zones',
       parent: [Object],
       id: 'us-central1-a',
       createMethod: undefined,
       methods: [Object],
       interceptors: [],
       Promise: [Function: Promise],
       create: undefined,
       delete: undefined,
       setMetadata: undefined,
       compute: [Object],
       name: 'us-central1-a',
       gceImages: [Object] },
    id: 'cps-loadtest-cps-gcloud-java-publisher-4-jr70',
    createMethod: [Function: bound wrapper],
    methods: { create: true, exists: true, get: true, getMetadata: true },
    interceptors: [],
    Promise: [Function: Promise] } ]
null [ VM {
    name: 'cps-loadtest-cps-gcloud-java-publisher-4-jr70',
    zone: 
     Zone {
       metadata: {},
       baseUrl: '/zones',
       parent: [Object],
       id: 'us-central1-a',
       createMethod: undefined,
       methods: [Object],
       interceptors: [],
       Promise: [Function: Promise],
       create: undefined,
       delete: undefined,
       setMetadata: undefined,
       compute: [Object],
       name: 'us-central1-a',
       gceImages: [Object] },
    hasActiveWaiters: false,
    waiters: [],
    url: 'https://www.googleapis.com/compute/v1/projects/precise-truck-742/zones/us-central1-a/instances/cps-loadtest-cps-gcloud-java-publisher-4-jr70',
    metadata: 
     { kind: 'compute#instance',
       id: '1086719671248952220',
       creationTimestamp: '2017-08-16T13:05:08.617-07:00',
       name: 'cps-loadtest-cps-gcloud-java-publisher-4-jr70',
       tags: [Object],
       machineType: 'https://www.googleapis.com/compute/v1/projects/precise-truck-742/zones/us-central1-a/machineTypes/n1-standard-4',
       status: 'RUNNING',
       zone: 'https://www.googleapis.com/compute/v1/projects/precise-truck-742/zones/us-central1-a',
       networkInterfaces: [Array],
       disks: [Array],
       metadata: [Object],
       serviceAccounts: [Array],
       selfLink: 'https://www.googleapis.com/compute/v1/projects/precise-truck-742/zones/us-central1-a/instances/cps-loadtest-cps-gcloud-java-publisher-4-jr70',
       scheduling: [Object],
       cpuPlatform: 'Intel Sandy Bridge',
       labelFingerprint: '42WmSpB8rSM=',
       startRestricted: false },
    baseUrl: '/instances',
    parent: 
     Zone {
       metadata: {},
       baseUrl: '/zones',
       parent: [Object],
       id: 'us-central1-a',
       createMethod: undefined,
       methods: [Object],
       interceptors: [],
       Promise: [Function: Promise],
       create: undefined,
       delete: undefined,
       setMetadata: undefined,
       compute: [Object],
       name: 'us-central1-a',
       gceImages: [Object] },
    id: 'cps-loadtest-cps-gcloud-java-publisher-4-jr70',
    createMethod: [Function: bound wrapper],
    methods: { create: true, exists: true, get: true, getMetadata: true },
    interceptors: [],
    Promise: [Function: Promise] } ]
```

[vms_0_docs]: https://cloud.google.com/compute/docs
[vms_0_code]: vms.js
