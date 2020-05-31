// design-time references
import { AwilixContainer } from 'awilix';

// run-time compiled references
import { CachingOptions, HttpOptions } from 'core.clients';

import { IProviderConfig, AbstractVersionLensProvider } from 'presentation.providers';

import { ComposerVersionLensProvider } from './composerProvider';
import { ComposerConfig } from './composerConfig';
import { IComposerContainerMap } from './definitions/iComposerContainerMap';
import { ComposerContributions } from './definitions/eComposerContributions';

// run-time file system imports
const { asFunction, asClass } = require('awilix');

export function composition(
  container: AwilixContainer<IComposerContainerMap>
): AbstractVersionLensProvider<IProviderConfig> {

  container.register({

    // logger
    composerLogger: asFunction(logger => logger.child({ namespace: 'composer' })).singleton(),

    // config
    composerConfig: asClass(ComposerConfig).singleton(),

    // options
    composerCachingOptions: asFunction(
      extension => new CachingOptions(
        extension.config,
        ComposerContributions.Caching,
        'caching'
      )
    ).singleton(),

    composerHttpOptions: asFunction(
      extension => new HttpOptions(
        extension.config,
        ComposerContributions.Http,
        'http'
      )
    ).singleton(),

    // lens provider
    composerProvider: asClass(ComposerVersionLensProvider).singleton(),
  });

  return container.cradle.composerProvider;
}