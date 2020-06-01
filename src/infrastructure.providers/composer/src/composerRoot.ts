// design-time references
import { AwilixContainer } from 'awilix';

// run-time compiled references
import { CachingOptions, HttpOptions } from 'core.clients';

import { createJsonClient } from 'infrastructure.clients';

import { IProviderConfig, AbstractVersionLensProvider } from 'presentation.providers';

import { ComposerContributions } from './definitions/eComposerContributions';
import { IComposerContainerMap } from './definitions/iComposerContainerMap';
import { ComposerVersionLensProvider } from './composerProvider'
import { ComposerConfig } from './composerConfig';
import { ComposerClient } from './composerClient';

// run-time file system imports
const { asFunction } = require('awilix');

export function composition(
  container: AwilixContainer<IComposerContainerMap>
): AbstractVersionLensProvider<IProviderConfig> {

  const containerMap: IComposerContainerMap = {

    // options
    composerCachingOpts: asFunction(
      extension => new CachingOptions(
        extension.config,
        ComposerContributions.Caching,
        'caching'
      )
    ).singleton(),

    composerHttpOpts: asFunction(
      extension => new HttpOptions(
        extension.config,
        ComposerContributions.Http,
        'http'
      )
    ).singleton(),

    // config
    composerConfig: asFunction(
      (extension, composerCachingOpts, composerHttpOpts) =>
        new ComposerConfig(extension, composerCachingOpts, composerHttpOpts)
    ).singleton(),

    // clients
    composerJsonClient: asFunction(
      (composerCachingOpts, composerHttpOpts, logger) =>
        createJsonClient(
          {
            caching: composerCachingOpts,
            http: composerHttpOpts
          },
          logger.child({ namespace: 'composer request' })
        )
    ).singleton(),

    composerClient: asFunction(
      (composerConfig, composerJsonClient, logger) =>
        new ComposerClient(
          composerConfig,
          composerJsonClient,
          logger.child({ namespace: 'composer client' })
        )
    ).singleton(),

    // provider
    composerProvider: asFunction(
      (composerConfig, composerClient, logger) =>
        new ComposerVersionLensProvider(
          composerConfig,
          composerClient,
          logger.child({ namespace: 'composer provider' })
        )
    ).singleton(),
  };

  container.register(<any>containerMap)

  return container.cradle.composerProvider;
}