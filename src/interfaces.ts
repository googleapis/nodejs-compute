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
