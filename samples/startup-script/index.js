/**
 * Copyright 2018, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const Compute = require('@google-cloud/compute');
const axios = require('axios');

const compute = new Compute();

const zone = compute.zone('us-central1-a');

async function createVm(name) {
  // Create a new VM, using default ubuntu image. The startup script
  // installs apache and a custom homepage.

  try {
    const config = {
      os: 'ubuntu',
      http: true,
      metadata: {
        items: [
          {
            key: 'startup-script',
            value: `#! /bin/bash
    
            # Installs apache and a custom homepage
            apt-get update
            apt-get install -y apache2
            cat <<EOF > /var/www/html/index.html
            <!doctype html>
            <h1>Hello World</h1>
            <p>This page was created from a simple start-up script!</p>`,
          },
        ],
      },
    };
    const vm = zone.vm(name);
    console.log('Creating VM ...');
    const data = await vm.create(config);
    await data[1].promise();
    const metadata = await vm.getMetadata();

    // External IP of the VM.
    const ip = metadata[0].networkInterfaces[0].accessConfigs[0].natIP;
    console.log(`Booting new VM with IP http://${ip}...`);

    // Ping the VM to determine when the HTTP server is ready.
    return await pingVM(ip);
  } catch (err) {
    console.error(`Something went wrong while creating ${name} :`, err);
  }
}

async function pingVM(ip) {
  return new Promise(resolve => {
    const timer = setInterval(
      async ip => {
        try {
          const res = await axios.get('http://' + ip);
          const statusCode = res.status;
          if (statusCode === 200) {
            // waiting = false;
            clearTimeout(timer);
            // HTTP server is ready.
            console.log('Ready!');
            resolve(ip);
            //return Promise.resolve(ip);
          } else {
            // HTTP server is not ready yet.
            process.stdout.write('.');
          }
        } catch (err) {
          process.stdout.write('.');
        }
      },
      2000,
      ip
    );
  });
}

// List all VMs and their external IPs in a given zone.
async function listVms() {
  try {
    const data = await zone.getVMs();
    const vms = data[0];
    const results = [];
    for (const i in vms) {
      const metadata = await vms[i].getMetadata();
      results.push(metadata);
    }

    return results.map(data => {
      return {
        ip: data[0]['networkInterfaces'][0]['accessConfigs']
          ? data[0]['networkInterfaces'][0]['accessConfigs'][0]['natIP']
          : 'no external ip',
        name: data[0].name,
      };
    });
  } catch (err) {
    console.error('Something went wrong while listing VMs :', err);
  }
}

async function deleteVm(name) {
  try {
    const vm = zone.vm(name);
    const data = await vm.delete();
    console.log('Deleting ...');
    await data[0].promise();
    // VM deleted
    return name;
  } catch (err) {
    console.error(`Something went wrong while deleting ${name} :`, err);
  }
}

exports.create = async name => {
  const ip = await createVm(name);
  console.log('ip is ' + ip);
  console.log(`${name} created succesfully`);
  return ip;
};

exports.list = async () => {
  const vms = await listVms();
  console.log(vms);
  return vms;
};

exports.delete = async name => {
  const result = await deleteVm(name);
  console.log(`${name} deleted succesfully`);
  return result;
};
