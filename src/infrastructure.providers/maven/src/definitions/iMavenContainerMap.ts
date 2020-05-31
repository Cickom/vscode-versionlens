// compiled run-time references
import { ICachingOptions, IHttpOptions } from 'core.clients';

import { IMavenLogger } from './iMavenLogger';
import { MavenConfig } from '../mavenConfig';
import { MavenVersionLensProvider } from '../mavenProvider';

export interface IMavenContainerMap {
  // config
  mavenConfig: MavenConfig,

  // logging
  mavenLogger: IMavenLogger,

  // options
  mavenCachingOptions: ICachingOptions,
  mavenHttpOptions: IHttpOptions,

  // provider
  mavenProvider: MavenVersionLensProvider
}