// design-time references
import * as VsCodeTypes from 'vscode';
import { AwilixContainer } from 'awilix';

// run-time compiled references
import { ILogger, LoggingOptions } from 'core.logging';
import { HttpOptions, CachingOptions } from 'core.clients';

import { VsCodeConfig } from 'infrastructure.configuration';
import { createWinstonLogger } from 'infrastructure.logging';

import {
  VersionLensExtension,
  registerIconCommands,
  registerSuggestionCommands,
  VersionLensState,
  TextEditorEvents
} from 'presentation.extension';
import { ProviderRegistry } from 'presentation.providers';

import { IContainerMap } from './container';

// run-time file system imports
const { window, languages: { registerCodeLensProvider } } = require('vscode');

const {
  createContainer,
  asValue,
  asFunction,
  asClass,
  InjectionMode
} = require('awilix');

export async function composition(context: VsCodeTypes.ExtensionContext) {

  const container: AwilixContainer<IContainerMap> = createContainer({
    injectionMode: InjectionMode.CLASSIC
  });

  const containerMap: IContainerMap = {

    // container (only for composing complex deps)
    container: asFunction(() => container).singleton(),

    // maps to the vscode configuration
    rootConfig: asClass(VsCodeConfig).singleton(),

    // logging
    outputChannel: asFunction(
      extensionName => window.createOutputChannel(extensionName)
    ).singleton(),

    logger: asFunction(createLogger).singleton(),

    // logging options
    loggingOptions: asFunction(
      rootConfig => new LoggingOptions(rootConfig, 'logging')
    ).singleton(),

    httpOptions: asFunction(
      rootConfig => new HttpOptions(rootConfig, 'http')
    ).singleton(),

    cachingOptions: asFunction(
      rootConfig => new CachingOptions(rootConfig, 'caching')
    ).singleton(),

    // extension
    extensionName: asValue(VersionLensExtension.extensionName.toLowerCase()),
    extension: asClass(VersionLensExtension).singleton(),
    extensionState: asClass(VersionLensState).singleton(),

    // commands
    subscriptions: asValue(context.subscriptions),
    iconCommands: asFunction(registerIconCommands).singleton(),
    suggestionCommands: asFunction(registerSuggestionCommands).singleton(),

    // events
    textEditorEvents: asClass(TextEditorEvents).singleton(),

    // providers
    providerRegistry: asClass(ProviderRegistry).singleton(),
  };

  // register the map
  container.register(<any>containerMap);

  // start up stuff
  const { version } = require('../package.json');

  const {
    logger,
    loggingOptions,
    textEditorEvents,
  } = container.cradle;

  // log general start up info
  logger.info('version: %s', version);
  logger.info('log level: %s', loggingOptions.level);
  logger.info('log path: %s', context.logPath);

  // invoke commands (todo move to extension class)
  container.resolve('iconCommands');
  container.resolve('suggestionCommands');

  await registerProviders(container)
    .then(_ => {
      // show icons in active text editor if versionLens.providerActive
      textEditorEvents.onDidChangeActiveTextEditor(window.activeTextEditor);
    });

}

function createLogger(outputChannel: VsCodeTypes.OutputChannel, loggingOptions: LoggingOptions): ILogger {
  const logger = createWinstonLogger(outputChannel, loggingOptions);
  return logger.child({ namespace: 'extension' });
}

async function registerProviders(container: AwilixContainer<IContainerMap>): Promise<any> {

  const { providerRegistry, logger, subscriptions } = container.cradle;

  const providerNames = providerRegistry.providerNames;

  logger.debug('Registering providers %o', providerNames.join(', '));

  const promised = providerNames.map(
    packageManager => {
      return import(`infrastructure.providers/${packageManager}/index`)
        .then(module => {

          logger.debug('Activating package manager %s', packageManager);

          const scopeContainer = container.createScope();
          const provider = module.composition(scopeContainer);

          logger.debug(
            'Activated package provider for %s:\n file pattern: %s\n caching: %s minutes\n strict ssl: %s\n',
            packageManager,
            provider.config.options.selector.pattern,
            provider.config.caching.duration,
            provider.config.http.strictSSL,
          );

          providerRegistry.register(provider);

          // register the command with vscode
          const sub = registerCodeLensProvider(
            provider.config.options.selector,
            provider
          );

          // give vscode the command disposable
          subscriptions.push(sub);

        })
        .catch(error => {
          logger.error(
            'Could not register package manager %s. Reason: %O',
            packageManager,
            error,
          );
        });
    }
  );

  return await Promise.all(promised);
}