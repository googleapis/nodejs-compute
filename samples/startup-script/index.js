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
const http = require('http');

const compute = new Compute();

// Create a new VM using the latest OS ubuntu image.
const zone = compute.zone('us-central1-a');

// Names must be unique within the same zone.
const name = 'ubuntu-http-' + Math.floor(Math.random() * 100);

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
        <html><body><h1>Hello World</h1>
          <p>This page was created from a simple start up script!</p>
        </body></html>`
      }
    ]
  }
}

// Create a new VM, using default ubuntu image. The startup script
// installs apache and a custom homepage.
zone
  .createVM(name, config)
  .then(data => {
    const vm = data[0];
    const operation = data[1];

    operation.on('complete', metadata => {
      vm.getMetadata().then(data => {
        const metadata = data[0];
        const ip = metadata['networkInterfaces'][0]['accessConfigs'][0]['natIP'];
        console.log(name + ' created, running at ' + ip);
        console.log('Waiting for startup...')

        const timer = setInterval(ip => {
          http.get(ip, res => {
            const { statusCode } = res
            if (statusCode === 200) {
              clearTimeout(timer);
              console.log('Ready!');
            }

          }).on('error', () => process.stdout.write('.'))
        }, 2000, 'http://' + ip)
      })
        .catch(err => console.error(err))
    })
  })
  .catch(err => console.error(err))

// List all VMs in that zone. 
zone.getVMs()
  .then(data => {
    const vms = data[0];
    vms.forEach(vm => {
      vm.getMetadata().then(data => {
        // todo(): Check if IP is present before accessing it.
        const ip = data[0]['networkInterfaces'][0]['accessConfigs'][0]['natIP'];
        console.log(vm.name + ': ' + ip)
      }).catch(err => console.error(err))
    })
  })
  .catch(err => console.error(err))

// Run the examples
// exports.main = cb => {
//   startupScriptExample(cb);
// };

// if (module === require.main) {
//   exports.main(console.log);
// }