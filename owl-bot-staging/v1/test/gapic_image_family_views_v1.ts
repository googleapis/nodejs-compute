// Copyright 2022 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ** This file is automatically generated by gapic-generator-typescript. **
// ** https://github.com/googleapis/gapic-generator-typescript **
// ** All changes to this file may be overwritten. **

import * as protos from '../protos/protos';
import * as assert from 'assert';
import * as sinon from 'sinon';
import {SinonStub} from 'sinon';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as imagefamilyviewsModule from '../src';

import {GoogleAuth, protobuf} from 'google-gax';

function generateSampleMessage<T extends object>(instance: T) {
    const filledObject = (instance.constructor as typeof protobuf.Message)
        .toObject(instance as protobuf.Message<T>, {defaults: true});
    return (instance.constructor as typeof protobuf.Message).fromObject(filledObject) as T;
}

function stubSimpleCall<ResponseType>(response?: ResponseType, error?: Error) {
    return error ? sinon.stub().rejects(error) : sinon.stub().resolves([response]);
}

function stubSimpleCallWithCallback<ResponseType>(response?: ResponseType, error?: Error) {
    return error ? sinon.stub().callsArgWith(2, error) : sinon.stub().callsArgWith(2, null, response);
}

describe('v1.ImageFamilyViewsClient', () => {
  let googleAuth: GoogleAuth;
  beforeEach(() => {
    googleAuth = {
      getClient: sinon.stub().resolves({
        getRequestHeaders: sinon.stub().resolves({Authorization: 'Bearer SOME_TOKEN'}),
      })
    } as unknown as GoogleAuth;
  });
  afterEach(() => {
    sinon.restore();
  });
    it('has servicePath', () => {
        const servicePath = imagefamilyviewsModule.v1.ImageFamilyViewsClient.servicePath;
        assert(servicePath);
    });

    it('has apiEndpoint', () => {
        const apiEndpoint = imagefamilyviewsModule.v1.ImageFamilyViewsClient.apiEndpoint;
        assert(apiEndpoint);
    });

    it('has port', () => {
        const port = imagefamilyviewsModule.v1.ImageFamilyViewsClient.port;
        assert(port);
        assert(typeof port === 'number');
    });

    it('should create a client with no option', () => {
        const client = new imagefamilyviewsModule.v1.ImageFamilyViewsClient();
        assert(client);
    });

    it('should create a client with gRPC fallback', () => {
        const client = new imagefamilyviewsModule.v1.ImageFamilyViewsClient({
            fallback: true,
        });
        assert(client);
    });

    it('has initialize method and supports deferred initialization', async () => {
        const client = new imagefamilyviewsModule.v1.ImageFamilyViewsClient({
              auth: googleAuth,
              projectId: 'bogus',
        });
        assert.strictEqual(client.imageFamilyViewsStub, undefined);
        await client.initialize();
        assert(client.imageFamilyViewsStub);
    });

    it('has close method', () => {
        const client = new imagefamilyviewsModule.v1.ImageFamilyViewsClient({
              auth: googleAuth,
              projectId: 'bogus',
        });
        client.close();
    });

    it('has getProjectId method', async () => {
        const fakeProjectId = 'fake-project-id';
        const client = new imagefamilyviewsModule.v1.ImageFamilyViewsClient({
              auth: googleAuth,
              projectId: 'bogus',
        });
        client.auth.getProjectId = sinon.stub().resolves(fakeProjectId);
        const result = await client.getProjectId();
        assert.strictEqual(result, fakeProjectId);
        assert((client.auth.getProjectId as SinonStub).calledWithExactly());
    });

    it('has getProjectId method with callback', async () => {
        const fakeProjectId = 'fake-project-id';
        const client = new imagefamilyviewsModule.v1.ImageFamilyViewsClient({
              auth: googleAuth,
              projectId: 'bogus',
        });
        client.auth.getProjectId = sinon.stub().callsArgWith(0, null, fakeProjectId);
        const promise = new Promise((resolve, reject) => {
            client.getProjectId((err?: Error|null, projectId?: string|null) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(projectId);
                }
            });
        });
        const result = await promise;
        assert.strictEqual(result, fakeProjectId);
    });

    describe('get', () => {
        it('invokes get without error', async () => {
            const client = new imagefamilyviewsModule.v1.ImageFamilyViewsClient({
              auth: googleAuth,
              projectId: 'bogus',
        });
            client.initialize();
            const request = generateSampleMessage(new protos.google.cloud.compute.v1.GetImageFamilyViewRequest());
            request.project = '';
            const expectedHeaderRequestParams = "project=";
            const expectedOptions = {
                otherArgs: {
                    headers: {
                        'x-goog-request-params': expectedHeaderRequestParams,
                    },
                },
            };
            const expectedResponse = generateSampleMessage(new protos.google.cloud.compute.v1.ImageFamilyView());
            client.innerApiCalls.get = stubSimpleCall(expectedResponse);
            const [response] = await client.get(request);
            assert.deepStrictEqual(response, expectedResponse);
            assert((client.innerApiCalls.get as SinonStub)
                .getCall(0).calledWith(request, expectedOptions, undefined));
        });

        it('invokes get without error using callback', async () => {
            const client = new imagefamilyviewsModule.v1.ImageFamilyViewsClient({
              auth: googleAuth,
              projectId: 'bogus',
        });
            client.initialize();
            const request = generateSampleMessage(new protos.google.cloud.compute.v1.GetImageFamilyViewRequest());
            request.project = '';
            const expectedHeaderRequestParams = "project=";
            const expectedOptions = {
                otherArgs: {
                    headers: {
                        'x-goog-request-params': expectedHeaderRequestParams,
                    },
                },
            };
            const expectedResponse = generateSampleMessage(new protos.google.cloud.compute.v1.ImageFamilyView());
            client.innerApiCalls.get = stubSimpleCallWithCallback(expectedResponse);
            const promise = new Promise((resolve, reject) => {
                 client.get(
                    request,
                    (err?: Error|null, result?: protos.google.cloud.compute.v1.IImageFamilyView|null) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
            });
            const response = await promise;
            assert.deepStrictEqual(response, expectedResponse);
            assert((client.innerApiCalls.get as SinonStub)
                .getCall(0).calledWith(request, expectedOptions /*, callback defined above */));
        });

        it('invokes get with error', async () => {
            const client = new imagefamilyviewsModule.v1.ImageFamilyViewsClient({
              auth: googleAuth,
              projectId: 'bogus',
        });
            client.initialize();
            const request = generateSampleMessage(new protos.google.cloud.compute.v1.GetImageFamilyViewRequest());
            request.project = '';
            const expectedHeaderRequestParams = "project=";
            const expectedOptions = {
                otherArgs: {
                    headers: {
                        'x-goog-request-params': expectedHeaderRequestParams,
                    },
                },
            };
            const expectedError = new Error('expected');
            client.innerApiCalls.get = stubSimpleCall(undefined, expectedError);
            await assert.rejects(client.get(request), expectedError);
            assert((client.innerApiCalls.get as SinonStub)
                .getCall(0).calledWith(request, expectedOptions, undefined));
        });
    });
});
