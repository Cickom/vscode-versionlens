// design-time references
import { AwilixContainer } from 'awilix';

// run-time compiled references
import { CachingOptions, HttpOptions } from 'core.clients';

import { IProviderConfig, AbstractVersionLensProvider } from 'presentation.providers';

import { PubConfig } from './pubConfig';
import { PubVersionLensProvider } from './pubProvider'
import { PubContributions } from './definitions/ePubContributions';
import { IPubContainerMap } from './definitions/iPubContainerMap';

// run-time file system imports
const { asFunction, asClass } = require('awilix');

export function composition(
  container: AwilixContainer<IPubContainerMap>
): AbstractVersionLensProvider<IProviderConfig> {

  container.register({

    // logger
    pubLogger: asFunction(logger => logger.child({ namespace: 'pub' })).singleton(),

    // config
    pubConfig: asClass(PubConfig).singleton(),

    // options
    pubCachingOptions: asFunction(
      extension => new CachingOptions(
        extension.config,
        PubContributions.Caching,
        'caching'
      )
    ).singleton(),

    pubHttpOptions: asFunction(
      extension => new HttpOptions(
        extension.config,
        PubContributions.Http,
        'http'
      )
    ).singleton(),

    // lens provider
    pubProvider: asClass(PubVersionLensProvider).singleton(),

  })

  return container.cradle.pubProvider;
}