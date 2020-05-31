// compiled run-time references
import { ILogger } from 'core.logging';
import { ICachingOptions, IHttpOptions } from 'core.clients';

import { DubConfig } from '../dubConfig';
import { DubVersionLensProvider } from '../dubProvider';


export interface IDubContainerMap {
  // config
  dubConfig: DubConfig,

  // logging
  dubLogger: ILogger,

  // options
  dubCachingOptions: ICachingOptions,
  dubHttpOptions: IHttpOptions,

  // provider
  dubProvider: DubVersionLensProvider
}