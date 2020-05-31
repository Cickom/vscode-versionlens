// vscode references
import * as VsCodeTypes from 'vscode';
import { AwilixContainer } from 'awilix';

import { CommandHelpers } from 'presentation.extension';
import { ProviderRegistry } from 'presentation.providers';

import { VersionLensExtension } from "../versionLensExtension";
import { VersionLensState } from '../versionLensState';
import * as InstalledStatusHelpers from '../helpers/installedStatusHelpers';

import { IconCommandContributions } from '../definitions/eIconCommandContributions';

import { IContainerMap } from '../../../container';

export class IconCommands {

  state: VersionLensState;

  extension: VersionLensExtension;

  outputChannel: VsCodeTypes.OutputChannel;

  providerRegistry: ProviderRegistry;

  constructor(
    extension: VersionLensExtension,
    outputChannel: VsCodeTypes.OutputChannel,
    providerRegistry: ProviderRegistry
  ) {
    this.extension = extension
    this.outputChannel = outputChannel;
    this.state = extension.state;
    this.providerRegistry = providerRegistry;
  }

  onShowError(resourceUri: VsCodeTypes.Uri) {
    return Promise.all([
      this.state.providerError.change(false),
      this.state.providerBusy.change(0)
    ])
      .then(_ => {
        this.outputChannel.show();
      });
  }

  onShowVersionLenses(resourceUri: VsCodeTypes.Uri) {
    this.state.enabled.change(true)
      .then(_ => {
        this.providerRegistry.refreshActiveCodeLenses();
      });
  }

  onHideVersionLenses(resourceUri: VsCodeTypes.Uri) {
    this.state.enabled.change(false)
      .then(_ => {
        this.providerRegistry.refreshActiveCodeLenses();
      });
  }

  onShowPrereleaseVersions(resourceUri: VsCodeTypes.Uri) {
    this.state.prereleasesEnabled.change(true)
      .then(_ => {
        this.providerRegistry.refreshActiveCodeLenses();
      });
  }

  onHidePrereleaseVersions(resourceUri: VsCodeTypes.Uri) {
    this.state.prereleasesEnabled.change(false)
      .then(_ => {
        this.providerRegistry.refreshActiveCodeLenses();
      });
  }

  onShowInstalledStatuses(resourceUri: VsCodeTypes.Uri) {
    this.state.installedStatusesEnabled.change(true)
      .then(_ => {
        this.providerRegistry.refreshActiveCodeLenses();
      });
  }

  onHideInstalledStatuses(resourceUri: VsCodeTypes.Uri) {
    this.state.installedStatusesEnabled.change(false)
      .then(_ => {
        InstalledStatusHelpers.clearDecorations();
      });
  }

  onShowingProgress(resourceUri: VsCodeTypes.Uri) { }

}

export function registerIconCommands(container: AwilixContainer<IContainerMap>): IconCommands {

  const {
    extension,
    providerRegistry,
    subscriptions,
    outputChannel,
    logger,
  } = container.cradle;

  // create the dependency
  const iconCommands = new IconCommands(
    extension,
    outputChannel,
    providerRegistry
  );

  // register commands with vscode
  subscriptions.push(
    ...CommandHelpers.registerCommands(
      IconCommandContributions,
      <any>iconCommands,
      logger
    )
  )

  return iconCommands;
}