// compiled run-time references
import { ILogger } from 'core.logging';
import { ICachingOptions, IHttpOptions } from 'core.clients';

import { ComposerConfig } from '../composerConfig';
import { ComposerVersionLensProvider } from '../composerProvider';

export interface IComposerContainerMap {
  // config
  composerConfig: ComposerConfig,

  // logging
  composerLogger: ILogger,

  // options
  composerCachingOptions: ICachingOptions,
  composerHttpOptions: IHttpOptions,

  // provider
  composerProvider: ComposerVersionLensProvider
}