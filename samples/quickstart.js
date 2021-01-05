const compute = require('@google-cloud/compute');

function sleep(timeoutMs) {
  return new Promise(resolve => {
    setTimeout(resolve, timeoutMs);
  });
}

// point GOOGLE_APPLICATION_CREDENTIALS environment variable to
// the JSON service account key file

async function main() {
  const client = new compute.AddressesClient({fallback: 'rest'});
  const project = 'PROJECT-NAME';
  const region = 'us-east1';

  const addressResource = {
    name: 'test-address-123',
  };

  const [insertResponse] = await client.insert({
    project,
    region,
    addressResource,
  });
  console.log(insertResponse);

  await sleep(5000);

  const [listResponse1] = await client.list({
    project,
    region,
  });
  console.log(listResponse1);

  const [deleteResponse] = await client.delete({
    project,
    region,
    address: addressResource.name,
  });
  console.log(deleteResponse);

  await sleep(5000);

  const [listResponse2] = await client.list({
    project,
    region,
  });
  console.log(listResponse2);
}

main();
