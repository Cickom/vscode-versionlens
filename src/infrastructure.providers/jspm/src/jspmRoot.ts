// design-time references
import { AwilixContainer } from 'awilix';

// run-time compiled references
import { CachingOptions, HttpOptions } from 'core.clients';

import { NpmContributions, GitHubOptions } from 'infrastructure.providers/npm';

import { IProviderConfig, AbstractVersionLensProvider } from 'presentation.providers';

import { JspmVersionLensProvider } from './jspmProvider';
import { JspmConfig } from './jspmConfig';
import { IJspmContainerMap } from './definitions/iJspmContainerMap';

// run-time file system imports
const { asFunction, asClass } = require('awilix');

export function composition(
  container: AwilixContainer<IJspmContainerMap>
): AbstractVersionLensProvider<IProviderConfig> {

  container.register({

    // logger
    jspmLogger: asFunction(logger => logger.child({ namespace: 'jspm' })).singleton(),

    // config
    jspmConfig: asClass(JspmConfig).singleton(),

    // options
    jspmCachingOptions: asFunction(
      extension => new CachingOptions(
        extension.config,
        NpmContributions.Caching,
        'caching'
      )
    ).singleton(),

    jspmHttpOptions: asFunction(
      extension => new HttpOptions(
        extension.config,
        NpmContributions.Http,
        'http'
      )
    ).singleton(),

    jspmGitHubOptions: asFunction(
      extension => new GitHubOptions(
        extension.config,
        NpmContributions.Github,
        'github'
      )
    ).singleton(),

    // lens provider
    jspmProvider: asClass(JspmVersionLensProvider).singleton(),
  });

  return container.cradle.jspmProvider;
}