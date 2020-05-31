// compiled run-time references
import { ILogger } from 'core.logging';
import { ICachingOptions, IHttpOptions } from 'core.clients';

import { PubConfig } from '../pubConfig';
import { PubVersionLensProvider } from '../pubProvider';

export interface IPubContainerMap {
  // config
  pubConfig: PubConfig,

  // logging
  pubLogger: ILogger,

  // options
  pubCachingOptions: ICachingOptions,
  pubHttpOptions: IHttpOptions,

  // provider
  pubProvider: PubVersionLensProvider
}