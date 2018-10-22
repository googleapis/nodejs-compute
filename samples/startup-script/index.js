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

const zone = compute.zone('us-central1-a');

// callback(error, externalIp)
function createVm(name, callback) {
  // Create a new VM, using default ubuntu image. The startup script
  // installs apache and a custom homepage.
  (async() =>{
    try{
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
      
      const data = await vm.create(config);
      console.log('Creating VM ...');
      await data[1].promise();
      const metadata = await vm.getMetadata();
      
      // External IP of the VM.
      const ip = metadata[0].networkInterfaces[0].accessConfigs[0].natIP;
      console.log(`Booting new VM with IP http://${ip}...`);

      // Ping the VM to determine when the HTTP server is ready.
      let waiting = true;
        const timer = setInterval(
          ip => {
            http
              .get('http://' + ip, res => {
                const statusCode = res.statusCode;
                if (statusCode === 200 && waiting) {
                  waiting = false;
                  clearTimeout(timer);
                  // HTTP server is ready.
                  console.log('Ready!');
                  callback(null, ip);
                }
              })
              .on('error', () => {
                // HTTP server is not ready yet.
                process.stdout.write('.');
              });
          },
          2000,
          ip
        );
      
    }catch(err){
      callback(err);
    }
  })();

}

// List all VMs and their external IPs in a given zone.
// callback(error, [[name, ip], [name, ip], ...])
function listVms(callback) {
  (async () => {
    try{
      const data = await zone.getVMs();
      const vms = data[0];
      const results=[];
      for(var i in vms){
        var metadata = await vms[i].getMetadata();
        results.push(metadata);
      }
      callback(
        null,
        results.map(data => {
          return {
            ip: data[0]['networkInterfaces'][0]['accessConfigs']
              ? data[0]['networkInterfaces'][0]['accessConfigs'][0]['natIP']
              : 'no external ip',
            name: data[0].name,
          };
        })
    )
    }
    catch(err){
      callback(err);
    }
  })();
}

function deleteVm(name, callback) {
  (async () => {
    try{
        const vm = zone.vm(name);
        const data = await vm.delete()
        console.log('Deleting ...');
        await data[0].promise();
        // VM deleted
        callback(null, name);
    }catch(err){
      callback(err);
    }
  })();  
  
}

exports.create = (name, cb) => {
  createVm(name, cb);
};

exports.list = cb => {
  listVms(cb);
};

exports.delete = (name, cb) => {
  deleteVm(name, cb);
};
