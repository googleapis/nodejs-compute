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
import type {ApiError, Metadata, ServiceObject} from '@google-cloud/common';
import type {ResourceStream} from '@google-cloud/paginator';

export interface BaseOptions {
  name?: string;
  description?: string;
}
export type NetworkTier = 'PREMIUM' | 'STANDARD';
export type IPVersion = 'IPV4' | 'IPV6';
export type Protocol = 'AH' | 'ESP' | 'SCTP' | 'TCP' | 'UDP';
export interface CryptKey {
  rawKey?: string;
  kmsKeyName?: string;
  kmsKeyServiceAccount?: string;
}
export type MetadataCallback = (
  error: ApiError | null,
  response?: Metadata | null
) => void;
export interface GuestOsFeatures {
  type?: string;
}
export interface Labeled {
  labels?: Record<string, string>;
  labelFingerprint?: string;
}
export interface GetResourcesOptions {
  autoPaginate?: boolean;
  filter?: string;
  maxApiCalls?: number;
  maxResults?: number;
  pageToken?: string;
}
export type GetResourcesCallback<T extends ServiceObject> = (
  error: ApiError | null,
  resources?: T[] | null,
  nextQuery?: GetResourcesOptions | null,
  apiResponse?: Metadata
) => void;
export type GetResourcesPromise<T extends ServiceObject> = Promise<[T[]]>;
export type GetResourcesStream<
  T extends ServiceObject,
  U extends GetResourcesOptions = GetResourcesOptions
> = (options?: U) => ResourceStream<T>;
