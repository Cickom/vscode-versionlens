// vscode references
import * as VsCodeTypes from 'vscode';

// imports
import appContrib from '../../../appContrib';
import {
  renderMissingDecoration,
  renderInstalledDecoration,
  renderOutdatedDecoration,
  renderNeedsUpdateDecoration,
  renderPrereleaseInstalledDecoration
} from 'presentation/editor/decorations';
import { AbstractVersionLensProvider, VersionLensFetchResponse } from 'presentation/lenses/abstract/abstractVersionLensProvider';
import { extractPackageLensDataFromText } from 'core/packages/parsers/jsonPackageParser';
import { npmGetOutdated, npmPackageDirExists } from 'core/providers/npm/npmApiClient.js';
import * as VersionLensFactory from '../../lenses/factories/versionLensFactory';
import { resolveNpmPackage } from './npmPackageResolver';
import { VersionLens } from 'presentation/lenses/models/versionLens';

export class NpmCodeLensProvider extends AbstractVersionLensProvider {

  _outdatedCache: Array<any>;

  constructor() {
    super();
    this._outdatedCache = [];
  }

  get selector() {
    return {
      language: 'json',
      scheme: 'file',
      pattern: '**/package.json',
      group: ['tags', 'statuses'],
    }
  }

  fetchVersionLenses(
    packagePath: string,
    document: VsCodeTypes.TextDocument,
    token: VsCodeTypes.CancellationToken
  ): VersionLensFetchResponse {

    const packageDepsLenses = extractPackageLensDataFromText(
      document.getText(),
      appContrib.npmDependencyProperties
    );
    if (packageDepsLenses.length === 0) return null;

    return VersionLensFactory.createVersionLenses(
      packagePath,
      document,
      packageDepsLenses,
      resolveNpmPackage
    );
  }

  // get the outdated packages and cache them
  updateOutdated(packagePath: string) {
    return npmGetOutdated(packagePath)
      .then(results => this._outdatedCache = results)
      .catch(err => {
        console.log("npmGetOutdated", err);
      });
  }
  /*
    generateDecoration(codeLens) {
      const documentPath = this.packagePath;
      const currentPackageName = codeLens.package.name;
  
      const packageDirExists = npmPackageDirExists(documentPath, currentPackageName);
      if (!packageDirExists) {
        renderMissingDecoration(codeLens.replaceRange);
        return;
      }
  
      Promise.resolve(this._outdatedCache)
        .then(outdated => {
          const findIndex = outdated.findIndex(
            (entry: any) => entry.name === currentPackageName
          );
  
          if (findIndex === -1) {
            renderInstalledDecoration(
              codeLens.replaceRange,
              codeLens.package.meta.tag.version
            );
            return;
          }
  
          const current = outdated[findIndex].current;
          const entered = codeLens.package.meta.tag.version;
  
          // no current means no install at all
          if (!current) {
            renderMissingDecoration(codeLens.replaceRange);
            return;
          }
  
          // if npm current and the entered version match it's installed
          if (current === entered) {
  
            if (codeLens.matchesLatestVersion())
              // up to date
              renderInstalledDecoration(
                codeLens.replaceRange,
                current
              );
            else if (codeLens.matchesPrereleaseVersion())
              // ahead of latest
              renderPrereleaseInstalledDecoration(
                codeLens.replaceRange,
                entered
              );
            else
              // out of date
              renderOutdatedDecoration(
                codeLens.replaceRange,
                current
              );
  
            return;
          }
  
          // signal needs update
          renderNeedsUpdateDecoration(
            codeLens.replaceRange,
            current
          );
  
        })
        .catch(console.error);
  
    }
  */
} // End NpmCodeLensProvider
