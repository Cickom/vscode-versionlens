import { IFrozenOptions } from "core.configuration";

export enum CachingContributions {
  CacheDuration = 'duration',
}

export interface ICachingOptions extends IFrozenOptions {

  config: IFrozenOptions;

  duration: number;

}

export enum HttpContributions {
  StrictSSL = 'strictSSL'
}

export interface IHttpOptions extends IFrozenOptions {

  config: IFrozenOptions;

  strictSSL: boolean;

}

export type HttpRequestOptions = {

    caching: ICachingOptions,

    http: IHttpOptions,

}