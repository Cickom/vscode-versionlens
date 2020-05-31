// design-time references
import * as VsCodeTypes from 'vscode';
import { AwilixContainer } from 'awilix';

// compiled run-time references
import { ILogger, LoggingOptions } from 'core.logging';
import { HttpOptions, CachingOptions } from 'core.clients';

import { VsCodeConfig } from 'infrastructure.configuration';

import {
  VersionLensExtension,
  VersionLensState,
  TextEditorEvents,
  IconCommands,
  SuggestionCommands
} from 'presentation.extension';
import { ProviderRegistry } from 'presentation.providers';

// application container map
export interface IContainerMap {

  // container (only for composing complex deps)
  container: AwilixContainer<IContainerMap>,

  // configuration
  rootConfig: VsCodeConfig,

  // logging
  outputChannel: VsCodeTypes.OutputChannel,
  logger: ILogger,

  // logging options
  loggingOptions: LoggingOptions,
  httpOptions: HttpOptions,
  cachingOptions: CachingOptions,

  // extension
  extensionName: string,
  extension: VersionLensExtension,
  extensionState: VersionLensState,

  // commands
  subscriptions: Array<VsCodeTypes.Disposable>,
  iconCommands: IconCommands,
  suggestionCommands: SuggestionCommands,

  // events
  textEditorEvents: TextEditorEvents,

  // providers
  providerRegistry: ProviderRegistry
}