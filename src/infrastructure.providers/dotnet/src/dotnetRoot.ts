// design-time references
import { AwilixContainer } from 'awilix';

// run-time compiled references
import { CachingOptions, HttpOptions } from 'core.clients';

import { IProviderConfig, AbstractVersionLensProvider } from 'presentation.providers';

import { IDotNetContainerMap } from './definitions/iDotNetContainerMap';
import { DotNetContributions } from './definitions/eDotNetContributions';
import { DotNetVersionLensProvider } from './dotnetProvider';
import { DotNetConfig } from './dotnetConfig';
import { NugetOptions } from './options/nugetOptions';

// run-time file system imports
const { asFunction, asClass } = require('awilix');

export function composition(
  container: AwilixContainer<IDotNetContainerMap>
): AbstractVersionLensProvider<IProviderConfig> {

  container.register({

    // logger
    dotnetLogger: asFunction(logger => logger.child({ namespace: 'dotnet' })).singleton(),

    // config
    dotnetConfig: asClass(DotNetConfig).singleton(),

    // options
    dotnetCachingOptions: asFunction(
      extension => new CachingOptions(
        extension.config,
        DotNetContributions.Caching,
        'caching'
      )
    ).singleton(),

    dotnetHttpOptions: asFunction(
      extension => new HttpOptions(
        extension.config,
        DotNetContributions.Http,
        'http'
      )
    ).singleton(),

    nugetOptions: asFunction(
      extension => new NugetOptions(
        extension.config,
        DotNetContributions.Nuget
      )
    ).singleton(),

    // lens provider
    dotnetProvider: asClass(DotNetVersionLensProvider).singleton(),
  });

  return container.cradle.dotnetProvider;
}