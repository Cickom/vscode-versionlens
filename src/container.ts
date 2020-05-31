// design-time references
import * as VsCodeTypes from 'vscode';

// compiled run-time references
import { ILogger, LoggingOptions } from 'core.logging';
import { HttpOptions, CachingOptions } from 'core.clients';

import { VsCodeConfig } from 'infrastructure.configuration';

import {
  VersionLensExtension,
  VersionLensState,
  TextEditorEvents
} from 'presentation.extension';
import { ProviderRegistry } from 'presentation.providers';

// application container map
export interface IContainerMap {

  subscriptions: Array<VsCodeTypes.Disposable>,

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

  // events
  textEditorEvents: TextEditorEvents,
  // textDocumentEvents: TextDocumentEvents,

  // providers
  providerRegistry: ProviderRegistry
}