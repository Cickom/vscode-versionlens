import { ILogger } from 'core.logging';
import {
  DocumentFactory,
  ResponseFactory,
  SuggestionFactory,
  PackageDocument,
  PackageSourceTypes,
  PackageRequest,
  VersionHelpers,
  IPackageClient,
  SemverSpec,
} from 'core.packages';
import {
  HttpClientResponse,
  HttpClientRequestMethods,
  IHttpClient
} from 'core.clients';

import { MavenClientData } from '../definitions/mavenClientData';
import { MavenConfig } from '../mavenConfig';

export class MavenClient implements IPackageClient<MavenClientData> {

  config: MavenConfig;

  httpClient: IHttpClient;

  logger: ILogger;

  constructor(config: MavenConfig, httpClient: IHttpClient, logger: ILogger) {
    this.config = config;
    this.httpClient = httpClient;
    this.logger = logger;
  }
  async fetchPackage(request: PackageRequest<MavenClientData>): Promise<PackageDocument> {
    const semverSpec = VersionHelpers.parseSemver(request.package.version);

    const { repositories } = request.clientData;
    const url = repositories[0].url
    let [group, artifact] = request.package.name.split(':');
    let search = group.replace(/\./g, "/") + "/" + artifact
    const queryUrl = `${url}${search}/maven-metadata.xml`;

    return this.createRemotePackageDocument(queryUrl, request, semverSpec)
      .catch((error: HttpClientResponse) => {
        if (error.status === 404) {
          return DocumentFactory.createNotFound(
            request.providerName,
            request.package,
            semverSpec.type,
            ResponseFactory.createResponseStatus(error.source, error.status)
          );
        }
        return Promise.reject(error);
      });
  }

  async createRemotePackageDocument(
    url: string,
    request: PackageRequest<MavenClientData>,
    semverSpec: SemverSpec
  ): Promise<PackageDocument> {

    const query = {};
    const headers = {};

    return this.httpClient.request(
      HttpClientRequestMethods.get,
      url,
      query,
      headers
    )
      .then(function (httpResponse): PackageDocument {

        const { data } = httpResponse;

        const source = PackageSourceTypes.Registry;

        const { providerName } = request;

        const requested = request.package;

        const versionRange = semverSpec.rawVersion;

        const response = {
          source: httpResponse.source,
          status: httpResponse.status,
        };

        // extract versions form xml
        const rawVersions = getVersionsFromPackageXml(data);

        // extract semver versions only
        const semverVersions = VersionHelpers.filterSemverVersions(rawVersions);

        // seperate versions to releases and prereleases
        const { releases, prereleases } = VersionHelpers.splitReleasesFromArray(
          semverVersions
        );

        const resolved = {
          name: requested.name,
          version: versionRange,
        };

        // analyse suggestions
        const suggestions = SuggestionFactory.createSuggestionTags(
          versionRange,
          releases,
          prereleases
        );

        return {
          providerName,
          source,
          response,
          type: semverSpec.type,
          requested,
          resolved,
          suggestions,
        };
      });
  }

}

function getVersionsFromPackageXml(packageXml: string): Array<string> {
  const xmldoc = require('xmldoc');
  let xmlRootNode = new xmldoc.XmlDocument(packageXml);
  let xmlVersioningNode = xmlRootNode.childNamed("versioning");
  let xmlVersionsList = xmlVersioningNode.childNamed("versions").childrenNamed("version");
  let versions = [];

  xmlVersionsList.forEach(xmlVersionNode => {
    versions.push(xmlVersionNode.val);
  })

  return versions
}