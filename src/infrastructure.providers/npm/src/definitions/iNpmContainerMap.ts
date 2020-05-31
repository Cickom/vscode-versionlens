// compiled run-time references
import { ILogger } from 'core.logging';
import { ICachingOptions, IHttpOptions } from 'core.clients';

import { NpmConfig } from '../npmConfig';
import { GitHubOptions } from '../options/githubOptions';
import { NpmVersionLensProvider } from '../npmProvider'

export interface INpmContainerMap {
  // config
  npmConfig: NpmConfig,

  // logging
  npmLogger: ILogger,

  // options
  npmCachingOptions: ICachingOptions,
  npmHttpOptions: IHttpOptions,
  npmGitHubOptions: GitHubOptions,

  // provider
  npmProvider: NpmVersionLensProvider
}