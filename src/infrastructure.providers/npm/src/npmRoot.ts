// design-time references
import { AwilixContainer } from 'awilix';

// run-time compiled references
import { CachingOptions, HttpOptions } from 'core.clients';

import { NpmConfig } from './npmConfig';
import { NpmVersionLensProvider } from './npmProvider'
import { GitHubOptions } from './options/githubOptions';
import { NpmContributions } from './definitions/eNpmContributions';
import { INpmContainerMap } from './definitions/iNpmContainerMap';
import { IProviderConfig, AbstractVersionLensProvider } from 'presentation.providers';

// run-time file system imports
const { asFunction, asClass } = require('awilix');

export function composition(
  container: AwilixContainer<INpmContainerMap>
): AbstractVersionLensProvider<IProviderConfig> {

  container.register({

    // logger
    npmLogger: asFunction(logger => logger.child({ namespace: 'npm' })).singleton(),

    // config
    npmConfig: asClass(NpmConfig).singleton(),

    // options
    npmCachingOptions: asFunction(
      extension => new CachingOptions(
        extension.config,
        NpmContributions.Caching,
        'caching'
      )
    ).singleton(),

    npmHttpOptions: asFunction(
      extension => new HttpOptions(
        extension.config,
        NpmContributions.Http,
        'http'
      )
    ).singleton(),

    npmGitHubOptions: asFunction(
      extension => new GitHubOptions(
        extension.config,
        NpmContributions.Github,
        'github'
      )
    ).singleton(),

    // lens provider
    npmProvider: asClass(NpmVersionLensProvider).singleton(),

  })

  return container.cradle.npmProvider;
}