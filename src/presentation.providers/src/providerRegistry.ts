import { KeyDictionary } from 'core.generics'
import { AbstractVersionLensProvider } from 'presentation.providers'
import { IProviderConfig } from './definitions/iProviderConfig';
import { ILogger } from 'core.logging';

export class ProviderRegistry {

  providers: KeyDictionary<AbstractVersionLensProvider<IProviderConfig>>;

  providerNames: Array<string>;

  logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;

    this.providers = {};

    this.providerNames = [
      'composer',
      'dotnet',
      'dub',
      'jspm',
      'maven',
      'npm',
      'pub',
    ];
  }

  register(
    provider: AbstractVersionLensProvider<IProviderConfig>
  ): AbstractVersionLensProvider<IProviderConfig> {

    const key = provider.config.options.providerName;
    if (this.has(key)) {
      const msg = "Provider already registered: " + key;
      this.logger.error(msg);
      throw new Error(msg);
    }

    this.providers[key] = provider;

    this.logger.debug(
      "Registered provider for %s:\t file pattern: %s\t caching: %s minutes\t strict ssl: %s",
      key,
      provider.config.options.selector.pattern,
      provider.config.caching.duration,
      provider.config.http.strictSSL,
    );

    return provider;
  }

  get(key: string) {
    return this.providers[key];
  }

  has(key: string) {
    return !!this.providers[key];
  }

  getByFileName(fileName: string): Array<AbstractVersionLensProvider<IProviderConfig>> {
    const path = require('path');
    const filename = path.basename(fileName);

    const providers = this.providerNames
      .map(name => this.providers[name])
      .filter(provider => provider !== undefined);

    if (providers.length === 0) return [];

    const filtered = providers.filter(
      provider => matchesFilename(filename, provider.config.options.selector.pattern)
    );
    if (filtered.length === 0) return [];

    return filtered;
  }

  refreshActiveCodeLenses() {
    const { window } = require('vscode');
    const fileName = window.activeTextEditor.document.fileName;
    const providers = this.getByFileName(fileName);
    if (!providers) return false;

    providers.forEach(provider => provider.refreshCodeLenses());

    return true;
  }

}

function matchesFilename(filename: string, pattern: string): boolean {
  const minimatch = require('minimatch');
  return minimatch(filename, pattern);
}