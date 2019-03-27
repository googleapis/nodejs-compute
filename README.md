[//]: # "This README.md file is auto-generated, all changes to this file will be lost."
[//]: # "To regenerate it, use `python -m synthtool`."
<img src="https://avatars2.githubusercontent.com/u/2810941?v=3&s=96" alt="Google Cloud Platform logo" title="Google Cloud Platform" align="right" height="96" width="96"/>

# [:  Client](https://github.com/)

None
[![npm version](https://img.shields.io/npm/v/@google-cloud/compute.svg)](https://www.npmjs.org/package/@google-cloud/compute)
[![codecov](https://img.shields.io/codecov/c/github//master.svg?style=flat)](https://codecov.io/gh/)


Google Compute Engine Client Library for Node.js


* [Using the client library](#using-the-client-library)
* [Samples](#samples)
* [Versioning](#versioning)
* [Contributing](#contributing)
* [License](#license)

## Using the client library

1.  [Select or create a Cloud Platform project][projects].
1.  [Enable the  API][enable_api].
1.  [Set up authentication with a service account][auth] so you can access the
    API from your local workstation.

1. Install the client library:

        npm install @google-cloud/compute


1. Try an example:

```
async function createVM(
  vmName = 'new_virtual_machine' // VM name of your choice
) {
  // Imports the Google Cloud client library
  const Compute = require('@google-cloud/compute');

  // Creates a client
  const compute = new Compute();

  // Create a new VM using the latest OS image of your choice.
  const zone = compute.zone('us-central1-c');

  // Start the VM create task
  const [vm, operation] = await zone.createVM(vmName, {os: 'ubuntu'});
  console.log(vm);

  // `operation` lets you check the status of long-running tasks.
  await operation.promise();

  // Complete!
  console.log('Virtual machine created!');
}

```



## Samples

Samples are in the [`samples/`](https://github.com//tree/master/samples) directory. The samples' `README.md`
has instructions for running the samples.

| Sample                      | Source Code                       | Try it |
| --------------------------- | --------------------------------- | ------ |
| Create V M | [source code](https://github.com//blob/master/samples/createVM.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/&page=editor&open_in_editor=samples/createVM.js,samples/README.md) |
| Delete V M | [source code](https://github.com//blob/master/samples/deleteVM.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/&page=editor&open_in_editor=samples/deleteVM.js,samples/README.md) |
| List V Ms | [source code](https://github.com//blob/master/samples/listVMs.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/&page=editor&open_in_editor=samples/listVMs.js,samples/README.md) |
| Mailjet | [source code](https://github.com//blob/master/samples/mailjet.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/&page=editor&open_in_editor=samples/mailjet.js,samples/README.md) |
| Sendgrid | [source code](https://github.com//blob/master/samples/sendgrid.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/&page=editor&open_in_editor=samples/sendgrid.js,samples/README.md) |
| Startup Script | [source code](https://github.com//blob/master/samples/startupScript.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/&page=editor&open_in_editor=samples/startupScript.js,samples/README.md) |
| Vms | [source code](https://github.com//blob/master/samples/vms.js) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/&page=editor&open_in_editor=samples/vms.js,samples/README.md) |



The [  Client API Reference][client-docs] documentation
also contains samples.

## Versioning

This library follows [Semantic Versioning](http://semver.org/).






More Information: [Google Cloud Platform Launch Stages][launch_stages]

[launch_stages]: https://cloud.google.com/terms/launch-stages

## Contributing

Contributions welcome! See the [Contributing Guide](https://github.com//blob/master/CONTRIBUTING.md).

## License

Apache Version 2.0

See [LICENSE](https://github.com//blob/master/LICENSE)

## What's Next

* [ Documentation][product-docs]
* [  Client API Reference][client-docs]
* [github.com/](https://github.com/)

Read more about the client libraries for Cloud APIs, including the older
Google APIs Client Libraries, in [Client Libraries Explained][explained].

[explained]: https://cloud.google.com/apis/docs/client-libraries-explained

[client-docs]: 
[product-docs]: 
[shell_img]: https://gstatic.com/cloudssh/images/open-btn.png
[projects]: https://console.cloud.google.com/project
[billing]: https://support.google.com/cloud/answer/6293499#enable-billing
[enable_api]: https://console.cloud.google.com/flows/enableapi?apiid=
[auth]: https://cloud.google.com/docs/authentication/getting-started