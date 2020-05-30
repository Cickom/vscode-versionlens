// design-time references
import * as VsCodeTypes from 'vscode';

// compiled run-time references
import { VsCodeConfig } from 'infrastructure.configuration';
import {
  VersionLensExtension,
  VersionLensState,
  TextEditorEvents
} from 'presentation.extension';
import { ILogger, LoggingOptions } from 'core.logging';
import { HttpOptions, CachingOptions } from 'core.clients';

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
}