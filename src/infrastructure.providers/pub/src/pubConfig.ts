import { ICachingOptions, IHttpOptions } from 'core.clients';

import { VersionLensExtension } from "presentation.extension";
import {
  ProviderSupport,
  IProviderOptions,
  AbstractProviderConfig,
} from 'presentation.providers';

import { PubContributions } from './definitions/ePubContributions';

export class PubConfig extends AbstractProviderConfig {

  options: IProviderOptions = {
    providerName: 'pub',
    supports: [
      ProviderSupport.Releases,
      ProviderSupport.Prereleases,
    ],
    selector: {
      language: "yaml",
      scheme: "file",
      pattern: "**/pubspec.yaml",
    }
  };

  caching: ICachingOptions;

  http: IHttpOptions;

  constructor(
    extension: VersionLensExtension,
    pubCachingOptions: ICachingOptions,
    pubHttpOptions: IHttpOptions,
  ) {
    super(extension);

    this.caching = pubCachingOptions;
    this.http = pubHttpOptions;
  }

  get dependencyProperties(): Array<string> {
    return this.extension.config.get(PubContributions.DependencyProperties);
  }

  get apiUrl(): string {
    return this.extension.config.get(PubContributions.ApiUrl);
  }

}