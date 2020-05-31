// design-time references
import { AwilixContainer } from 'awilix';

// run-time compiled references
import { CachingOptions, HttpOptions } from 'core.clients';

import { MavenConfig } from './mavenConfig';
import { MavenVersionLensProvider } from './mavenProvider'
import { MavenContributions } from './definitions/eMavenContributions';
import { IMavenContainerMap } from './definitions/iMavenContainerMap';
import { IProviderConfig, AbstractVersionLensProvider } from 'presentation.providers';

// run-time file system imports
const { asFunction, asClass } = require('awilix');

export function composition(
  container: AwilixContainer<IMavenContainerMap>
): AbstractVersionLensProvider<IProviderConfig> {

  container.register({

    // logger
    mavenLogger: asFunction(logger => logger.child({ namespace: 'maven' })).singleton(),

    // config
    mavenConfig: asClass(MavenConfig).singleton(),

    // options
    mavenCachingOptions: asFunction(
      extension => new CachingOptions(
        extension.config,
        MavenContributions.Caching,
        'caching'
      )
    ).singleton(),

    mavenHttpOptions: asFunction(
      extension => new HttpOptions(
        extension.config,
        MavenContributions.Http,
        'http'
      )
    ).singleton(),

    // lens provider
    mavenProvider: asClass(MavenVersionLensProvider).singleton(),
  });

  return container.cradle.mavenProvider;
}