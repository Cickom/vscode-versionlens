// compiled run-time references
import { ILogger } from 'core.logging';
import { ICachingOptions, IHttpOptions } from 'core.clients';

import { DotNetConfig } from '../dotnetConfig';
import { DotNetVersionLensProvider } from '../dotnetProvider';
import { NugetOptions } from '../options/nugetOptions';

export interface IDotNetContainerMap {
  // config
  dotnetConfig: DotNetConfig,

  // logging
  dotnetLogger: ILogger,

  // options
  dotnetCachingOptions: ICachingOptions,
  dotnetHttpOptions: IHttpOptions,
  nugetOptions: NugetOptions,

  // provider
  dotnetProvider: DotNetVersionLensProvider
}