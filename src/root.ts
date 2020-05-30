// design-time references
import * as VsCodeTypes from 'vscode';
import * as AwilixTypes from 'awilix';

// compiled run-time references
import { VsCodeConfig } from 'infrastructure.configuration';
import { createWinstonLogger } from 'infrastructure.logging';
import { registerProviders } from 'presentation.providers';
import {
  VersionLensExtension,
  registerIconCommands,
  registerSuggestionCommands,
  VersionLensState,
  TextEditorEvents
} from 'presentation.extension';
import { ILogger, LoggingOptions } from 'core.logging';
import { HttpOptions, CachingOptions } from 'core.clients';
import { IContainerMap } from 'container';

// run-time references
const { window } = require('vscode');
const {
  createContainer,
  asValue,
  asFunction,
  asClass,
  InjectionMode
} = require('awilix');

export async function composition(context: VsCodeTypes.ExtensionContext) {

  const container: AwilixTypes.AwilixContainer<IContainerMap> = createContainer({
    injectionMode: InjectionMode.CLASSIC,
  })

  // register the map
  container.register({

    // used when un\registering commands
    subscriptions: asValue(context.subscriptions),

    // maps to the vscode configuration
    rootConfig: asClass(VsCodeConfig).singleton(),

    // logging
    outputChannel: asFunction(extensionName => window.createOutputChannel(extensionName)).singleton(),
    logger: asFunction(createLogger).singleton(),

    // logging options
    loggingOptions: asFunction(rootConfig => new LoggingOptions(rootConfig, 'logging')).singleton(),
    httpOptions: asFunction(rootConfig => new HttpOptions(rootConfig, 'http')).singleton(),
    cachingOptions: asFunction(rootConfig => new CachingOptions(rootConfig, 'caching')).singleton(),

    // extension
    extensionName: asValue(VersionLensExtension.extensionName.toLowerCase()),
    extension: asClass(VersionLensExtension).singleton(),
    extensionState: asClass(VersionLensState).singleton(),

    // events
    textEditorEvents: asClass(TextEditorEvents).singleton()

    // not used anymore
    // textDocumentEvents: asFunction(
    //   (extensionState, logger) => new TextDocumentEvents(extensionState, logger)
    // ).singleton(),
  })

  const { version } = require('../package.json');

  const {
    extension,
    logger,
    subscriptions,
    textEditorEvents
  } = container.cradle;

  // Setup the logger
  logger.info('version: %s', version);
  logger.info('log level: %s', extension.logging.level);
  logger.info('log path: %s', context.logPath);

  registerIconCommands(extension, subscriptions, logger);
  registerSuggestionCommands(extension, subscriptions, logger);

  // TODO register each provider in to the container
  await registerProviders(extension, subscriptions, logger);

  // show icons in active text editor if versionLens.providerActive
  textEditorEvents.onDidChangeActiveTextEditor(window.activeTextEditor);
}

function createLogger(outputChannel: VsCodeTypes.OutputChannel, loggingOptions: LoggingOptions): ILogger {
  const logger = createWinstonLogger(outputChannel, loggingOptions);
  return logger.child({ namespace: 'extension' });
}
