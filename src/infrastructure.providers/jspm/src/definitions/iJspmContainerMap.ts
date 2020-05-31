// compiled run-time references
import { ILogger } from 'core.logging';

import { ICachingOptions, IHttpOptions } from 'core.clients';

import { GitHubOptions } from 'infrastructure.providers/npm';

import { JspmConfig } from '../jspmConfig';
import { JspmVersionLensProvider } from '../jspmProvider';

export interface IJspmContainerMap {
  // config
  jspmConfig: JspmConfig,

  // logging
  jspmLogger: ILogger,

  // options
  jspmCachingOptions: ICachingOptions,
  jspmHttpOptions: IHttpOptions,
  jspmGitHubOptions: GitHubOptions,

  // provider
  jspmProvider: JspmVersionLensProvider
}