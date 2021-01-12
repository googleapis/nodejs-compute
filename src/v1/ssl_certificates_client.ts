// Copyright 2021 Google LLC
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

/* global window */
import * as gax from 'google-gax';
import {Callback, CallOptions, Descriptors, ClientOptions} from 'google-gax';
import * as path from 'path';

import * as protos from '../../protos/protos';
/**
 * Client JSON configuration object, loaded from
 * `src/v1/ssl_certificates_client_config.json`.
 * This file defines retry strategy and timeouts for all API methods in this library.
 */
import * as gapicConfig from './ssl_certificates_client_config.json';

const version = require('../../../package.json').version;

/**
 *  The SslCertificates API.
 * @class
 * @memberof v1
 */
export class SslCertificatesClient {
  private _terminated = false;
  private _opts: ClientOptions;
  private _gaxModule: typeof gax | typeof gax.fallback;
  private _gaxGrpc: gax.GrpcClient | gax.fallback.GrpcClient;
  private _protos: {};
  private _defaults: {[method: string]: gax.CallSettings};
  auth: gax.GoogleAuth;
  descriptors: Descriptors = {
    page: {},
    stream: {},
    longrunning: {},
    batching: {},
  };
  innerApiCalls: {[name: string]: Function};
  sslCertificatesStub?: Promise<{[name: string]: Function}>;

  /**
   * Construct an instance of SslCertificatesClient.
   *
   * @param {object} [options] - The configuration object.
   * The options accepted by the constructor are described in detail
   * in [this document](https://github.com/googleapis/gax-nodejs/blob/master/client-libraries.md#creating-the-client-instance).
   * The common options are:
   * @param {object} [options.credentials] - Credentials object.
   * @param {string} [options.credentials.client_email]
   * @param {string} [options.credentials.private_key]
   * @param {string} [options.email] - Account email address. Required when
   *     using a .pem or .p12 keyFilename.
   * @param {string} [options.keyFilename] - Full path to the a .json, .pem, or
   *     .p12 key downloaded from the Google Developers Console. If you provide
   *     a path to a JSON file, the projectId option below is not necessary.
   *     NOTE: .pem and .p12 require you to specify options.email as well.
   * @param {number} [options.port] - The port on which to connect to
   *     the remote host.
   * @param {string} [options.projectId] - The project ID from the Google
   *     Developer's Console, e.g. 'grape-spaceship-123'. We will also check
   *     the environment variable GCLOUD_PROJECT for your project ID. If your
   *     app is running in an environment which supports
   *     {@link https://developers.google.com/identity/protocols/application-default-credentials Application Default Credentials},
   *     your project ID will be detected automatically.
   * @param {string} [options.apiEndpoint] - The domain name of the
   *     API remote host.
   * @param {gax.ClientConfig} [options.clientConfig] - Client configuration override.
   *     Follows the structure of {@link gapicConfig}.
   * @param {boolean} [options.fallback] - Use HTTP fallback mode.
   *     In fallback mode, a special browser-compatible transport implementation is used
   *     instead of gRPC transport. In browser context (if the `window` object is defined)
   *     the fallback mode is enabled automatically; set `options.fallback` to `false`
   *     if you need to override this behavior.
   */
  constructor(opts?: ClientOptions) {
    // Ensure that options include all the required fields.
    const staticMembers = this.constructor as typeof SslCertificatesClient;
    const servicePath =
      opts?.servicePath || opts?.apiEndpoint || staticMembers.servicePath;
    const port = opts?.port || staticMembers.port;
    const clientConfig = opts?.clientConfig ?? {};
    const fallback =
      opts?.fallback ??
      (typeof window !== 'undefined' && typeof window?.fetch === 'function');
    opts = Object.assign({servicePath, port, clientConfig, fallback}, opts);

    // If scopes are unset in options and we're connecting to a non-default endpoint, set scopes just in case.
    if (servicePath !== staticMembers.servicePath && !('scopes' in opts)) {
      opts['scopes'] = staticMembers.scopes;
    }

    // Choose either gRPC or proto-over-HTTP implementation of google-gax.
    this._gaxModule = opts.fallback ? gax.fallback : gax;

    // Create a `gaxGrpc` object, with any grpc-specific options sent to the client.
    this._gaxGrpc = new this._gaxModule.GrpcClient(opts);

    // Save options to use in initialize() method.
    this._opts = opts;

    // Save the auth object to the client, for use by other methods.
    this.auth = this._gaxGrpc.auth as gax.GoogleAuth;

    // Set the default scopes in auth client if needed.
    if (servicePath === staticMembers.servicePath) {
      this.auth.defaultScopes = staticMembers.scopes;
    }

    // Determine the client header string.
    const clientHeader = [`gax/${this._gaxModule.version}`, `gapic/${version}`];
    if (typeof process !== 'undefined' && 'versions' in process) {
      clientHeader.push(`gl-node/${process.versions.node}`);
    } else {
      clientHeader.push(`gl-web/${this._gaxModule.version}`);
    }
    if (!opts.fallback) {
      clientHeader.push(`grpc/${this._gaxGrpc.grpcVersion}`);
    }
    if (opts.libName && opts.libVersion) {
      clientHeader.push(`${opts.libName}/${opts.libVersion}`);
    }
    // Load the applicable protos.
    // For Node.js, pass the path to JSON proto file.
    // For browsers, pass the JSON content.

    const nodejsProtoPath = path.join(
      __dirname,
      '..',
      '..',
      'protos',
      'protos.json'
    );
    this._protos = this._gaxGrpc.loadProto(
      opts.fallback
        ? // eslint-disable-next-line @typescript-eslint/no-var-requires
          require('../../protos/protos.json')
        : nodejsProtoPath
    );

    // Put together the default options sent with requests.
    this._defaults = this._gaxGrpc.constructSettings(
      'google.cloud.compute.v1.SslCertificates',
      gapicConfig as gax.ClientConfig,
      opts.clientConfig || {},
      {'x-goog-api-client': clientHeader.join(' ')}
    );

    // Set up a dictionary of "inner API calls"; the core implementation
    // of calling the API is handled in `google-gax`, with this code
    // merely providing the destination and request information.
    this.innerApiCalls = {};
  }

  /**
   * Initialize the client.
   * Performs asynchronous operations (such as authentication) and prepares the client.
   * This function will be called automatically when any class method is called for the
   * first time, but if you need to initialize it before calling an actual method,
   * feel free to call initialize() directly.
   *
   * You can await on this method if you want to make sure the client is initialized.
   *
   * @returns {Promise} A promise that resolves to an authenticated service stub.
   */
  initialize() {
    // If the client stub promise is already initialized, return immediately.
    if (this.sslCertificatesStub) {
      return this.sslCertificatesStub;
    }

    // Put together the "service stub" for
    // google.cloud.compute.v1.SslCertificates.
    this.sslCertificatesStub = this._gaxGrpc.createStub(
      this._opts.fallback
        ? (this._protos as protobuf.Root).lookupService(
            'google.cloud.compute.v1.SslCertificates'
          )
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this._protos as any).google.cloud.compute.v1.SslCertificates,
      this._opts
    ) as Promise<{[method: string]: Function}>;

    // Iterate over each of the methods that the service provides
    // and create an API call method for each.
    const sslCertificatesStubMethods = [
      'aggregatedList',
      'delete',
      'get',
      'insert',
      'list',
    ];
    for (const methodName of sslCertificatesStubMethods) {
      const callPromise = this.sslCertificatesStub.then(
        stub => (...args: Array<{}>) => {
          if (this._terminated) {
            return Promise.reject('The client has already been closed.');
          }
          const func = stub[methodName];
          return func.apply(stub, args);
        },
        (err: Error | null | undefined) => () => {
          throw err;
        }
      );

      const descriptor = undefined;
      const apiCall = this._gaxModule.createApiCall(
        callPromise,
        this._defaults[methodName],
        descriptor
      );

      this.innerApiCalls[methodName] = apiCall;
    }

    return this.sslCertificatesStub;
  }

  /**
   * The DNS address for this API service.
   * @returns {string} The DNS address for this service.
   */
  static get servicePath() {
    return 'compute.googleapis.com';
  }

  /**
   * The DNS address for this API service - same as servicePath(),
   * exists for compatibility reasons.
   * @returns {string} The DNS address for this service.
   */
  static get apiEndpoint() {
    return 'compute.googleapis.com';
  }

  /**
   * The port for this API service.
   * @returns {number} The default port for this service.
   */
  static get port() {
    return 443;
  }

  /**
   * The scopes needed to make gRPC calls for every method defined
   * in this service.
   * @returns {string[]} List of default scopes.
   */
  static get scopes() {
    return [
      'https://www.googleapis.com/auth/compute',
      'https://www.googleapis.com/auth/cloud-platform',
    ];
  }

  getProjectId(): Promise<string>;
  getProjectId(callback: Callback<string, undefined, undefined>): void;
  /**
   * Return the project ID used by this class.
   * @returns {Promise} A promise that resolves to string containing the project ID.
   */
  getProjectId(
    callback?: Callback<string, undefined, undefined>
  ): Promise<string> | void {
    if (callback) {
      this.auth.getProjectId(callback);
      return;
    }
    return this.auth.getProjectId();
  }

  // -------------------
  // -- Service calls --
  // -------------------
  aggregatedList(
    request: protos.google.cloud.compute.v1.IAggregatedListSslCertificatesRequest,
    options?: CallOptions
  ): Promise<
    [
      protos.google.cloud.compute.v1.ISslCertificateAggregatedList,
      (
        | protos.google.cloud.compute.v1.IAggregatedListSslCertificatesRequest
        | undefined
      ),
      {} | undefined
    ]
  >;
  aggregatedList(
    request: protos.google.cloud.compute.v1.IAggregatedListSslCertificatesRequest,
    options: CallOptions,
    callback: Callback<
      protos.google.cloud.compute.v1.ISslCertificateAggregatedList,
      | protos.google.cloud.compute.v1.IAggregatedListSslCertificatesRequest
      | null
      | undefined,
      {} | null | undefined
    >
  ): void;
  aggregatedList(
    request: protos.google.cloud.compute.v1.IAggregatedListSslCertificatesRequest,
    callback: Callback<
      protos.google.cloud.compute.v1.ISslCertificateAggregatedList,
      | protos.google.cloud.compute.v1.IAggregatedListSslCertificatesRequest
      | null
      | undefined,
      {} | null | undefined
    >
  ): void;
  /**
   * Retrieves the list of all SslCertificate resources, regional and global, available to the specified project.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.filter
   *   A filter expression that filters resources listed in the response. The expression must specify the field name, a comparison operator, and the value that you want to use for filtering. The value must be a string, a number, or a boolean. The comparison operator must be either `=`, `!=`, `>`, or `<`.
   *
   *   For example, if you are filtering Compute Engine instances, you can exclude instances named `example-instance` by specifying `name != example-instance`.
   *
   *   You can also filter nested fields. For example, you could specify `scheduling.automaticRestart = false` to include instances only if they are not scheduled for automatic restarts. You can use filtering on nested fields to filter based on resource labels.
   *
   *   To filter on multiple expressions, provide each separate expression within parentheses. For example: ``` (scheduling.automaticRestart = true) (cpuPlatform = "Intel Skylake") ``` By default, each expression is an `AND` expression. However, you can include `AND` and `OR` expressions explicitly. For example: ``` (cpuPlatform = "Intel Skylake") OR (cpuPlatform = "Intel Broadwell") AND (scheduling.automaticRestart = true) ```
   * @param {boolean} request.includeAllScopes
   *   Indicates whether every visible scope for each scope type (zone, region, global) should be included in the response. For new resource types added after this field, the flag has no effect as new resource types will always include every visible scope for each scope type in response. For resource types which predate this field, if this flag is omitted or false, only scopes of the scope types where the resource type is expected to be found will be included.
   * @param {number} request.maxResults
   *   The maximum number of results per page that should be returned. If the number of available results is larger than `maxResults`, Compute Engine returns a `nextPageToken` that can be used to get the next page of results in subsequent list requests. Acceptable values are `0` to `500`, inclusive. (Default: `500`)
   * @param {string} request.orderBy
   *   Sorts list results by a certain order. By default, results are returned in alphanumerical order based on the resource name.
   *
   *   You can also sort results in descending order based on the creation timestamp using `orderBy="creationTimestamp desc"`. This sorts results based on the `creationTimestamp` field in reverse chronological order (newest result first). Use this to sort resources like operations so that the newest operation is returned first.
   *
   *   Currently, only sorting by `name` or `creationTimestamp desc` is supported.
   * @param {string} request.pageToken
   *   Specifies a page token to use. Set `pageToken` to the `nextPageToken` returned by a previous list request to get the next page of results.
   * @param {string} request.project
   *   Name of the project scoping this request.
   * @param {boolean} request.returnPartialSuccess
   *   Opt-in for partial success behavior which provides partial results in case of failure. The default value is false and the logic is the same as today.
   * @param {object} [options]
   *   Call options. See {@link https://googleapis.dev/nodejs/google-gax/latest/interfaces/CallOptions.html|CallOptions} for more details.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [SslCertificateAggregatedList]{@link google.cloud.compute.v1.SslCertificateAggregatedList}.
   *   Please see the
   *   [documentation](https://github.com/googleapis/gax-nodejs/blob/master/client-libraries.md#regular-methods)
   *   for more details and examples.
   * @example
   * const [response] = await client.aggregatedList(request);
   */
  aggregatedList(
    request: protos.google.cloud.compute.v1.IAggregatedListSslCertificatesRequest,
    optionsOrCallback?:
      | CallOptions
      | Callback<
          protos.google.cloud.compute.v1.ISslCertificateAggregatedList,
          | protos.google.cloud.compute.v1.IAggregatedListSslCertificatesRequest
          | null
          | undefined,
          {} | null | undefined
        >,
    callback?: Callback<
      protos.google.cloud.compute.v1.ISslCertificateAggregatedList,
      | protos.google.cloud.compute.v1.IAggregatedListSslCertificatesRequest
      | null
      | undefined,
      {} | null | undefined
    >
  ): Promise<
    [
      protos.google.cloud.compute.v1.ISslCertificateAggregatedList,
      (
        | protos.google.cloud.compute.v1.IAggregatedListSslCertificatesRequest
        | undefined
      ),
      {} | undefined
    ]
  > | void {
    request = request || {};
    let options: CallOptions;
    if (typeof optionsOrCallback === 'function' && callback === undefined) {
      callback = optionsOrCallback;
      options = {};
    } else {
      options = optionsOrCallback as CallOptions;
    }
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      project: request.project || '',
    });
    this.initialize();
    return this.innerApiCalls.aggregatedList(request, options, callback);
  }
  delete(
    request: protos.google.cloud.compute.v1.IDeleteSslCertificateRequest,
    options?: CallOptions
  ): Promise<
    [
      protos.google.cloud.compute.v1.IOperation,
      protos.google.cloud.compute.v1.IDeleteSslCertificateRequest | undefined,
      {} | undefined
    ]
  >;
  delete(
    request: protos.google.cloud.compute.v1.IDeleteSslCertificateRequest,
    options: CallOptions,
    callback: Callback<
      protos.google.cloud.compute.v1.IOperation,
      | protos.google.cloud.compute.v1.IDeleteSslCertificateRequest
      | null
      | undefined,
      {} | null | undefined
    >
  ): void;
  delete(
    request: protos.google.cloud.compute.v1.IDeleteSslCertificateRequest,
    callback: Callback<
      protos.google.cloud.compute.v1.IOperation,
      | protos.google.cloud.compute.v1.IDeleteSslCertificateRequest
      | null
      | undefined,
      {} | null | undefined
    >
  ): void;
  /**
   * Deletes the specified SslCertificate resource.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.project
   *   Project ID for this request.
   * @param {string} request.requestId
   *   An optional request ID to identify requests. Specify a unique request ID so that if you must retry your request, the server will know to ignore the request if it has already been completed.
   *
   *   For example, consider a situation where you make an initial request and the request times out. If you make the request again with the same request ID, the server can check if original operation with the same request ID was received, and if so, will ignore the second request. This prevents clients from accidentally creating duplicate commitments.
   *
   *   The request ID must be a valid UUID with the exception that zero UUID is not supported (00000000-0000-0000-0000-000000000000).
   * @param {string} request.sslCertificate
   *   Name of the SslCertificate resource to delete.
   * @param {object} [options]
   *   Call options. See {@link https://googleapis.dev/nodejs/google-gax/latest/interfaces/CallOptions.html|CallOptions} for more details.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Operation]{@link google.cloud.compute.v1.Operation}.
   *   Please see the
   *   [documentation](https://github.com/googleapis/gax-nodejs/blob/master/client-libraries.md#regular-methods)
   *   for more details and examples.
   * @example
   * const [response] = await client.delete(request);
   */
  delete(
    request: protos.google.cloud.compute.v1.IDeleteSslCertificateRequest,
    optionsOrCallback?:
      | CallOptions
      | Callback<
          protos.google.cloud.compute.v1.IOperation,
          | protos.google.cloud.compute.v1.IDeleteSslCertificateRequest
          | null
          | undefined,
          {} | null | undefined
        >,
    callback?: Callback<
      protos.google.cloud.compute.v1.IOperation,
      | protos.google.cloud.compute.v1.IDeleteSslCertificateRequest
      | null
      | undefined,
      {} | null | undefined
    >
  ): Promise<
    [
      protos.google.cloud.compute.v1.IOperation,
      protos.google.cloud.compute.v1.IDeleteSslCertificateRequest | undefined,
      {} | undefined
    ]
  > | void {
    request = request || {};
    let options: CallOptions;
    if (typeof optionsOrCallback === 'function' && callback === undefined) {
      callback = optionsOrCallback;
      options = {};
    } else {
      options = optionsOrCallback as CallOptions;
    }
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      project: request.project || '',
    });
    this.initialize();
    return this.innerApiCalls.delete(request, options, callback);
  }
  get(
    request: protos.google.cloud.compute.v1.IGetSslCertificateRequest,
    options?: CallOptions
  ): Promise<
    [
      protos.google.cloud.compute.v1.ISslCertificate,
      protos.google.cloud.compute.v1.IGetSslCertificateRequest | undefined,
      {} | undefined
    ]
  >;
  get(
    request: protos.google.cloud.compute.v1.IGetSslCertificateRequest,
    options: CallOptions,
    callback: Callback<
      protos.google.cloud.compute.v1.ISslCertificate,
      | protos.google.cloud.compute.v1.IGetSslCertificateRequest
      | null
      | undefined,
      {} | null | undefined
    >
  ): void;
  get(
    request: protos.google.cloud.compute.v1.IGetSslCertificateRequest,
    callback: Callback<
      protos.google.cloud.compute.v1.ISslCertificate,
      | protos.google.cloud.compute.v1.IGetSslCertificateRequest
      | null
      | undefined,
      {} | null | undefined
    >
  ): void;
  /**
   * Returns the specified SslCertificate resource. Gets a list of available SSL certificates by making a list() request.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.project
   *   Project ID for this request.
   * @param {string} request.sslCertificate
   *   Name of the SslCertificate resource to return.
   * @param {object} [options]
   *   Call options. See {@link https://googleapis.dev/nodejs/google-gax/latest/interfaces/CallOptions.html|CallOptions} for more details.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [SslCertificate]{@link google.cloud.compute.v1.SslCertificate}.
   *   Please see the
   *   [documentation](https://github.com/googleapis/gax-nodejs/blob/master/client-libraries.md#regular-methods)
   *   for more details and examples.
   * @example
   * const [response] = await client.get(request);
   */
  get(
    request: protos.google.cloud.compute.v1.IGetSslCertificateRequest,
    optionsOrCallback?:
      | CallOptions
      | Callback<
          protos.google.cloud.compute.v1.ISslCertificate,
          | protos.google.cloud.compute.v1.IGetSslCertificateRequest
          | null
          | undefined,
          {} | null | undefined
        >,
    callback?: Callback<
      protos.google.cloud.compute.v1.ISslCertificate,
      | protos.google.cloud.compute.v1.IGetSslCertificateRequest
      | null
      | undefined,
      {} | null | undefined
    >
  ): Promise<
    [
      protos.google.cloud.compute.v1.ISslCertificate,
      protos.google.cloud.compute.v1.IGetSslCertificateRequest | undefined,
      {} | undefined
    ]
  > | void {
    request = request || {};
    let options: CallOptions;
    if (typeof optionsOrCallback === 'function' && callback === undefined) {
      callback = optionsOrCallback;
      options = {};
    } else {
      options = optionsOrCallback as CallOptions;
    }
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      project: request.project || '',
    });
    this.initialize();
    return this.innerApiCalls.get(request, options, callback);
  }
  insert(
    request: protos.google.cloud.compute.v1.IInsertSslCertificateRequest,
    options?: CallOptions
  ): Promise<
    [
      protos.google.cloud.compute.v1.IOperation,
      protos.google.cloud.compute.v1.IInsertSslCertificateRequest | undefined,
      {} | undefined
    ]
  >;
  insert(
    request: protos.google.cloud.compute.v1.IInsertSslCertificateRequest,
    options: CallOptions,
    callback: Callback<
      protos.google.cloud.compute.v1.IOperation,
      | protos.google.cloud.compute.v1.IInsertSslCertificateRequest
      | null
      | undefined,
      {} | null | undefined
    >
  ): void;
  insert(
    request: protos.google.cloud.compute.v1.IInsertSslCertificateRequest,
    callback: Callback<
      protos.google.cloud.compute.v1.IOperation,
      | protos.google.cloud.compute.v1.IInsertSslCertificateRequest
      | null
      | undefined,
      {} | null | undefined
    >
  ): void;
  /**
   * Creates a SslCertificate resource in the specified project using the data included in the request.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.project
   *   Project ID for this request.
   * @param {string} request.requestId
   *   An optional request ID to identify requests. Specify a unique request ID so that if you must retry your request, the server will know to ignore the request if it has already been completed.
   *
   *   For example, consider a situation where you make an initial request and the request times out. If you make the request again with the same request ID, the server can check if original operation with the same request ID was received, and if so, will ignore the second request. This prevents clients from accidentally creating duplicate commitments.
   *
   *   The request ID must be a valid UUID with the exception that zero UUID is not supported (00000000-0000-0000-0000-000000000000).
   * @param {google.cloud.compute.v1.SslCertificate} request.sslCertificateResource
   *   The body resource for this request
   * @param {object} [options]
   *   Call options. See {@link https://googleapis.dev/nodejs/google-gax/latest/interfaces/CallOptions.html|CallOptions} for more details.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Operation]{@link google.cloud.compute.v1.Operation}.
   *   Please see the
   *   [documentation](https://github.com/googleapis/gax-nodejs/blob/master/client-libraries.md#regular-methods)
   *   for more details and examples.
   * @example
   * const [response] = await client.insert(request);
   */
  insert(
    request: protos.google.cloud.compute.v1.IInsertSslCertificateRequest,
    optionsOrCallback?:
      | CallOptions
      | Callback<
          protos.google.cloud.compute.v1.IOperation,
          | protos.google.cloud.compute.v1.IInsertSslCertificateRequest
          | null
          | undefined,
          {} | null | undefined
        >,
    callback?: Callback<
      protos.google.cloud.compute.v1.IOperation,
      | protos.google.cloud.compute.v1.IInsertSslCertificateRequest
      | null
      | undefined,
      {} | null | undefined
    >
  ): Promise<
    [
      protos.google.cloud.compute.v1.IOperation,
      protos.google.cloud.compute.v1.IInsertSslCertificateRequest | undefined,
      {} | undefined
    ]
  > | void {
    request = request || {};
    let options: CallOptions;
    if (typeof optionsOrCallback === 'function' && callback === undefined) {
      callback = optionsOrCallback;
      options = {};
    } else {
      options = optionsOrCallback as CallOptions;
    }
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      project: request.project || '',
    });
    this.initialize();
    return this.innerApiCalls.insert(request, options, callback);
  }
  list(
    request: protos.google.cloud.compute.v1.IListSslCertificatesRequest,
    options?: CallOptions
  ): Promise<
    [
      protos.google.cloud.compute.v1.ISslCertificateList,
      protos.google.cloud.compute.v1.IListSslCertificatesRequest | undefined,
      {} | undefined
    ]
  >;
  list(
    request: protos.google.cloud.compute.v1.IListSslCertificatesRequest,
    options: CallOptions,
    callback: Callback<
      protos.google.cloud.compute.v1.ISslCertificateList,
      | protos.google.cloud.compute.v1.IListSslCertificatesRequest
      | null
      | undefined,
      {} | null | undefined
    >
  ): void;
  list(
    request: protos.google.cloud.compute.v1.IListSslCertificatesRequest,
    callback: Callback<
      protos.google.cloud.compute.v1.ISslCertificateList,
      | protos.google.cloud.compute.v1.IListSslCertificatesRequest
      | null
      | undefined,
      {} | null | undefined
    >
  ): void;
  /**
   * Retrieves the list of SslCertificate resources available to the specified project.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.filter
   *   A filter expression that filters resources listed in the response. The expression must specify the field name, a comparison operator, and the value that you want to use for filtering. The value must be a string, a number, or a boolean. The comparison operator must be either `=`, `!=`, `>`, or `<`.
   *
   *   For example, if you are filtering Compute Engine instances, you can exclude instances named `example-instance` by specifying `name != example-instance`.
   *
   *   You can also filter nested fields. For example, you could specify `scheduling.automaticRestart = false` to include instances only if they are not scheduled for automatic restarts. You can use filtering on nested fields to filter based on resource labels.
   *
   *   To filter on multiple expressions, provide each separate expression within parentheses. For example: ``` (scheduling.automaticRestart = true) (cpuPlatform = "Intel Skylake") ``` By default, each expression is an `AND` expression. However, you can include `AND` and `OR` expressions explicitly. For example: ``` (cpuPlatform = "Intel Skylake") OR (cpuPlatform = "Intel Broadwell") AND (scheduling.automaticRestart = true) ```
   * @param {number} request.maxResults
   *   The maximum number of results per page that should be returned. If the number of available results is larger than `maxResults`, Compute Engine returns a `nextPageToken` that can be used to get the next page of results in subsequent list requests. Acceptable values are `0` to `500`, inclusive. (Default: `500`)
   * @param {string} request.orderBy
   *   Sorts list results by a certain order. By default, results are returned in alphanumerical order based on the resource name.
   *
   *   You can also sort results in descending order based on the creation timestamp using `orderBy="creationTimestamp desc"`. This sorts results based on the `creationTimestamp` field in reverse chronological order (newest result first). Use this to sort resources like operations so that the newest operation is returned first.
   *
   *   Currently, only sorting by `name` or `creationTimestamp desc` is supported.
   * @param {string} request.pageToken
   *   Specifies a page token to use. Set `pageToken` to the `nextPageToken` returned by a previous list request to get the next page of results.
   * @param {string} request.project
   *   Project ID for this request.
   * @param {boolean} request.returnPartialSuccess
   *   Opt-in for partial success behavior which provides partial results in case of failure. The default value is false and the logic is the same as today.
   * @param {object} [options]
   *   Call options. See {@link https://googleapis.dev/nodejs/google-gax/latest/interfaces/CallOptions.html|CallOptions} for more details.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [SslCertificateList]{@link google.cloud.compute.v1.SslCertificateList}.
   *   Please see the
   *   [documentation](https://github.com/googleapis/gax-nodejs/blob/master/client-libraries.md#regular-methods)
   *   for more details and examples.
   * @example
   * const [response] = await client.list(request);
   */
  list(
    request: protos.google.cloud.compute.v1.IListSslCertificatesRequest,
    optionsOrCallback?:
      | CallOptions
      | Callback<
          protos.google.cloud.compute.v1.ISslCertificateList,
          | protos.google.cloud.compute.v1.IListSslCertificatesRequest
          | null
          | undefined,
          {} | null | undefined
        >,
    callback?: Callback<
      protos.google.cloud.compute.v1.ISslCertificateList,
      | protos.google.cloud.compute.v1.IListSslCertificatesRequest
      | null
      | undefined,
      {} | null | undefined
    >
  ): Promise<
    [
      protos.google.cloud.compute.v1.ISslCertificateList,
      protos.google.cloud.compute.v1.IListSslCertificatesRequest | undefined,
      {} | undefined
    ]
  > | void {
    request = request || {};
    let options: CallOptions;
    if (typeof optionsOrCallback === 'function' && callback === undefined) {
      callback = optionsOrCallback;
      options = {};
    } else {
      options = optionsOrCallback as CallOptions;
    }
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      project: request.project || '',
    });
    this.initialize();
    return this.innerApiCalls.list(request, options, callback);
  }

  /**
   * Terminate the gRPC channel and close the client.
   *
   * The client will no longer be usable and all future behavior is undefined.
   * @returns {Promise} A promise that resolves when the client is closed.
   */
  close(): Promise<void> {
    this.initialize();
    if (!this._terminated) {
      return this.sslCertificatesStub!.then(stub => {
        this._terminated = true;
        stub.close();
      });
    }
    return Promise.resolve();
  }
}
