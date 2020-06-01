// design-time references
import * as VsCodeTypes from 'vscode';
import { AwilixContainer } from 'awilix';

// run-time compiled references
import { LoggingOptions } from 'core.logging';
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
const {
  workspace,
  window,
  languages: { registerCodeLensProvider }
} = require('vscode');

const {
  createContainer,
  asValue,
  asFunction,
  InjectionMode
} = require('awilix');

export async function composition(context: VsCodeTypes.ExtensionContext) {

  const container: AwilixContainer<IContainerMap> = createContainer({
    injectionMode: InjectionMode.CLASSIC
  });

  const containerMap: IContainerMap = {

    extensionName: asValue(VersionLensExtension.extensionName.toLowerCase()),

    // vscode abstractions
    vscodeWorkspace: asValue(workspace),

    // maps to the vscode configuration
    rootConfig: asFunction(
      (vscodeWorkspace, extensionName) =>
        new VsCodeConfig(vscodeWorkspace, extensionName)
    ).singleton(),

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

    // logging
    outputChannel: asFunction(
      extensionName => window.createOutputChannel(extensionName)
    ).singleton(),

    logger: asFunction(
      (outputChannel, loggingOptions) =>
        createWinstonLogger(outputChannel, loggingOptions)
          .child({ namespace: 'extension' })
    ).singleton(),

    // extension
    extension: asFunction(
      rootConfig => new VersionLensExtension(rootConfig)
    ).singleton(),

    extensionState: asFunction(
      extension => new VersionLensState(extension)
    ).singleton(),

    // commands
    subscriptions: asValue(context.subscriptions),

    iconCommands: asFunction(
      (extensionState, providerRegistry, subscriptions, outputChannel, logger) =>
        registerIconCommands(
          extensionState,
          providerRegistry,
          subscriptions,
          outputChannel,
          logger.child({ namespace: 'icon commands' })
        )
    ).singleton(),

    suggestionCommands: asFunction(
      (extension, subscriptions, logger) =>
        registerSuggestionCommands(
          extension,
          subscriptions,
          logger.child({ namespace: 'suggestion commands' })
        )
    ).singleton(),

    // events
    textEditorEvents: asFunction(
      (extensionState, providerRegistry, logger) =>
        new TextEditorEvents(
          extensionState,
          providerRegistry,
          logger.child({ namespace: 'text editor' })
        )
    ).singleton(),

    // providers
    providerRegistry: asFunction(
      logger => new ProviderRegistry(
        logger.child({ namespace: 'provider registry' })
      )
    ).singleton(),
  };

  // register the map
  container.register(<any>containerMap);

  // start up stuff
  const { version } = require('../package.json');

  // invoke commands (todo move to extension class)
  container.resolve('iconCommands');
  container.resolve('suggestionCommands');

  const {
    logger,
    loggingOptions,
    textEditorEvents,
  } = container.cradle;

  // log general start up info
  logger.info('version: %s', version);
  logger.info('log level: %s', loggingOptions.level);
  logger.info('log path: %s', context.logPath);

  // add providers to the providerRegistry
  await registerProviders(container)
    .then(() => {
      // show icons in active text editor if versionLens.providerActive
      textEditorEvents.onDidChangeActiveTextEditor(window.activeTextEditor);
    });
}

async function registerProviders(container: AwilixContainer<IContainerMap>): Promise<any> {

  const { providerRegistry, subscriptions, logger } = container.cradle;

  const providerNames = providerRegistry.providerNames;

  logger.debug('Registering providers %o', providerNames.join(', '));

  const promised = providerNames.map(
    providerName => {
      return import(`infrastructure.providers/${providerName}/index`)
        .then(module => {

          logger.debug('Activating container scope for %s', providerName);

          // create a container scope for the provider
          const scopeContainer = container.createScope();
          const provider = module.composition(scopeContainer);

          // register the provider
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
            'Could not register provider %s. Reason: %O',
            providerName,
            error,
          );
        });
    }
  );

  return await Promise.all(promised);
}