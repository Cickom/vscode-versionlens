// design-time references
import { AwilixContainer } from 'awilix';

// run-time compiled references
import { CachingOptions, HttpOptions } from 'core.clients';

import { IProviderConfig, AbstractVersionLensProvider } from 'presentation.providers';

import { DubVersionLensProvider } from './dubProvider';
import { DubConfig } from './dubConfig';
import { IDubContainerMap } from './definitions/iDubContainerMap';
import { DubContributions } from './definitions/eDubContributions';

// run-time file system imports
const { asFunction, asClass } = require('awilix');

export function composition(
  container: AwilixContainer<IDubContainerMap>
): AbstractVersionLensProvider<IProviderConfig> {

  container.register({

    // logger
    dubLogger: asFunction(logger => logger.child({ namespace: 'dub' })).singleton(),

    // config
    dubConfig: asClass(DubConfig).singleton(),

    // options
    dubCachingOptions: asFunction(
      extension => new CachingOptions(
        extension.config,
        DubContributions.Caching,
        'caching'
      )
    ).singleton(),

    dubHttpOptions: asFunction(
      extension => new HttpOptions(
        extension.config,
        DubContributions.Http,
        'http'
      )
    ).singleton(),

    // lens provider
    dubProvider: asClass(DubVersionLensProvider).singleton(),
  });

  return container.cradle.dubProvider;
}