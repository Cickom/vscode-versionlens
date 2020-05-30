// vscode references
import * as VsCodeTypes from 'vscode';

import { IFrozenRepository } from 'core.generics';
import { LoggingOptions, ILoggingOptions } from 'core.logging';
import {
  CachingOptions,
  ICachingOptions,
  HttpOptions,
  IHttpOptions
} from 'core.clients';

import { VersionLensState } from "presentation.extension";

import { SuggestionsOptions } from "./options/suggestionsOptions";
import { StatusesOptions } from "./options/statusesOptions";

export enum SuggestionIndicators {
  Update = '\u2191',
  Revert = '\u2193',
  OpenNewWindow = '\u29C9',
}

export class VersionLensExtension {

  static extensionName: string = 'VersionLens';

  config: IFrozenRepository;

  logging: ILoggingOptions;

  caching: ICachingOptions;

  http: IHttpOptions;

  suggestions: SuggestionsOptions;

  statuses: StatusesOptions;

  state: VersionLensState;

  outputChannel: VsCodeTypes.OutputChannel;

  constructor(
    rootConfig: IFrozenRepository,
    outputChannel: VsCodeTypes.OutputChannel,
    loggingOptions: LoggingOptions,
    httpOptions: HttpOptions,
    cachingOptions: CachingOptions,
  ) {
    this.config = rootConfig;

    // instantiate contrib options
    this.logging = loggingOptions;
    this.caching = cachingOptions;
    this.http = httpOptions;

    this.suggestions = new SuggestionsOptions(rootConfig);
    this.statuses = new StatusesOptions(rootConfig);

    // instantiate setContext options
    this.state = new VersionLensState(this);

    this.outputChannel = outputChannel;
  }

}