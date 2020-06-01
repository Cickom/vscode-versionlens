// vscode references
import * as VsCodeTypes from 'vscode';

import { ILogger } from 'core.logging';
import { PackageSourceTypes } from 'core.packages';

import { VersionLens } from 'presentation.lenses';
import { CommandHelpers } from 'presentation.extension';

import { VersionLensExtension } from "../versionLensExtension";
import { VersionLensState } from '../versionLensState';
import { SuggestionCommandContributions } from '../definitions/eSuggestionCommandContributions';

export class SuggestionCommands {

  state: VersionLensState;

  extension: VersionLensExtension;

  logger: ILogger;

  constructor(extension: VersionLensExtension, logger: ILogger) {
    this.extension = extension
    this.state = extension.state;
    this.logger = logger;
  }

  onUpdateDependencyCommand(codeLens: VersionLens, packageVersion: string) {
    if ((<any>codeLens).__replaced) return Promise.resolve();

    const { workspace, WorkspaceEdit } = require('vscode');
    const edit = new WorkspaceEdit();
    edit.replace(codeLens.documentUrl, codeLens.replaceRange, packageVersion);

    return workspace.applyEdit(edit)
      .then(done => (<any>codeLens).__replaced = true);
  }

  onLinkCommand(codeLens: VersionLens) {
    const path = require('path');

    if (codeLens.package.source !== PackageSourceTypes.Directory) {
      this.logger.error(
        "onLinkCommand can only open local directories.\nPackage: %o",
        codeLens.package
      );
      return;
    }

    const { env } = require('vscode');

    const filePathToOpen = path.resolve(
      path.dirname(codeLens.documentUrl.fsPath),
      codeLens.package.resolved.version
    );

    env.openExternal('file:///' + filePathToOpen);
  }

}

export function registerSuggestionCommands(
  extension: VersionLensExtension,
  subscriptions: Array<VsCodeTypes.Disposable>,
  logger: ILogger
): SuggestionCommands {

  // create the dependency
  const suggestionCommands = new SuggestionCommands(extension, logger);

  // register commands with vscode
  subscriptions.push(
    ...CommandHelpers.registerCommands(
      SuggestionCommandContributions,
      <any>suggestionCommands,
      logger
    )
  );

  return suggestionCommands;
}