// vscode references
import * as VsCodeTypes from 'vscode';

// imports
import { ILogger } from 'core.logging';
import { UrlHelpers } from 'core.clients';
import { RequestFactory } from 'core.packages';

import { AbstractVersionLensProvider } from 'presentation.providers';

import { MavenClientData } from './definitions/mavenClientData';
import * as MavenXmlFactory from './mavenXmlParserFactory';
import { MavenConfig } from './mavenConfig';
import { MvnClient } from './clients/mvnClient';
import { MavenClient } from './clients/mavenClient';

export class MavenVersionLensProvider
  extends AbstractVersionLensProvider<MavenConfig> {

  mvnClient: MvnClient;

  mavenClient: MavenClient;

  constructor(mavenConfig: MavenConfig, mavenLogger: ILogger) {
    super(mavenConfig, mavenLogger);

    const requestOptions = {
      caching: mavenConfig.caching,
      http: mavenConfig.http
    };

    this.mvnClient = new MvnClient(
      mavenConfig,
      mavenLogger.child({ namespace: 'maven cli' })
    );

    this.mavenClient = new MavenClient(
      mavenConfig,
      requestOptions,
      mavenLogger.child({ namespace: 'maven pkg client' })
    );
  }

  async fetchVersionLenses(
    packagePath: string,
    document: VsCodeTypes.TextDocument,
    token: VsCodeTypes.CancellationToken,
  ) {
    const packageDependencies = MavenXmlFactory.createDependenciesFromXml(
      document.getText(),
      this.config.dependencyProperties
    );
    if (packageDependencies.length === 0) return null;

    // gets source feeds from the project path
    const promisedRepos = this.mvnClient.fetchRepositories(packagePath);

    return promisedRepos.then(repos => {

      const repositories = repos.filter(
        repo => repo.protocol === UrlHelpers.RegistryProtocols.https
      );

      const includePrereleases = this.extension.state.prereleasesEnabled.value;

      const clientData: MavenClientData = { repositories }

      const clientContext = {
        includePrereleases,
        clientData,
      }

      return RequestFactory.executeDependencyRequests(
        packagePath,
        this.mavenClient,
        packageDependencies,
        clientContext,
      );
    })

  }

}