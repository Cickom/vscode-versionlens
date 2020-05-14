import {
  DocumentFactory,
  ResponseFactory,
  PackageRequest,
  PackageIdentifier,
  SuggestionFactory,
  VersionHelpers,
  PackageResponseStatus,
  PackageDocument,
  PackageVersionTypes,
  PackageSourceTypes,
  PackageSuggestion,
  PackageSuggestionFlags
} from 'core/packages';

import NpmConfig from 'providers/npm/config';
import { ClientResponseSource } from "core/clients";

export async function fetchNpmPackage(request: PackageRequest): Promise<PackageDocument> {
  const npa = require('npm-package-arg');
  let npaResult;

  return new Promise<PackageDocument>(function (resolve, reject) {

    try {
      npaResult = npa.resolve(request.package.name, request.package.version, request.package.path);
    } catch (error) {
      return reject(
        ResponseFactory.createUnexpected(
          NpmConfig.provider,
          request.package,
          {
            source: ClientResponseSource.remote,
            status: error.code,
            data: error.message
          },
        )
      );
    }

    if (npaResult.type === PackageSourceTypes.directory || npaResult.type === PackageSourceTypes.file)
      resolve(
        createDirectoryPackageDocument(
          request.package,
          ResponseFactory.createResponseStatus(ClientResponseSource.local, 200),
          npaResult,
        )
      );
    else
      resolve(createRemotePackageDocument(request, npaResult));

  }).catch(error => {
    const { response, data: npaResult } = error

    if (!response) return Promise.reject(error);

    if (response.status === 'E404') {
      return DocumentFactory.createNotFound(
        NpmConfig.provider,
        request.package,
        null,
        ResponseFactory.createResponseStatus(response.source, 404)
      );
    }

    if (response.status === 'EINVALIDTAGNAME' || response.data.includes('Invalid comparator:')) {
      return DocumentFactory.createInvalidVersion(
        NpmConfig.provider,
        request.package,
        ResponseFactory.createResponseStatus(response.source, 404),
        null
      );
    }

    if (response.status === 'EUNSUPPORTEDPROTOCOL') {
      return DocumentFactory.createNotSupported(
        NpmConfig.provider,
        request.package,
        ResponseFactory.createResponseStatus(response.source, 404),
        null
      );
    }

    if (response.status === 128) {
      return DocumentFactory.createGitFailed(
        NpmConfig.provider,
        request.package,
        ResponseFactory.createResponseStatus(response.source, 404),
        null
      );
    }

    return Promise.reject(error);
  });

}

async function createRemotePackageDocument(request: PackageRequest, npaResult: any): Promise<PackageDocument> {
  const pacote = require('pacote');
  const npmConfig = require('libnpmconfig');

  // get npm config
  const npmOpts = npmConfig.read(
    {
      where: request.package.path,
      fullMetadata: false,
      // 'prefer-online': true,
    },
    {
      cwd: request.package.path,
    }
  );

  return pacote.packument(npaResult, npmOpts)
    .then(function (packumentResponse): PackageDocument {
      const { compareLoose } = require("semver");

      const source: PackageSourceTypes = getSourceFromNpaResult(npaResult);
      const type: PackageVersionTypes = getVersionTypeFromNpaResult(npaResult);
      let versionRange: string = getRangeFromNpaResult(npaResult);
      const gitSpec: any = source === PackageSourceTypes.git ? npaResult.hosted : null

      const requested = request.package;

      const resolved = {
        name: npaResult.name,
        version: versionRange,
      };

      const response = {
        source: ClientResponseSource.remote,
        status: 200,
      };

      if (npaResult.type === PackageVersionTypes.alias) {
        resolved.name = npaResult.subSpec.name;
      }

      // extract releases
      const releases = Object.keys(packumentResponse.versions || {}).sort(compareLoose);

      // extract prereleases from dist tags
      const prereleases = VersionHelpers.filterPrereleasesFromDistTags(
        packumentResponse['dist-tags'] || {}
      ).sort(compareLoose)

      // check if the version requested is a tag. eg latest|next
      const distTags = packumentResponse['dist-tags'] || {};
      if (npaResult.type === PackageVersionTypes.tag) {
        versionRange = distTags[requested.version];
        if (!versionRange) return DocumentFactory.createNoMatch(
          NpmConfig.provider,
          source,
          type,
          requested,
          // suggest the latest release if available
          releases.length > 0 ? releases[releases.length - 1] : null
        );
      }

      // analyse suggestions
      const suggestions = SuggestionFactory.createSuggestionTags(
        versionRange,
        releases,
        prereleases
      );

      return {
        provider: NpmConfig.provider,
        source,
        response,
        type,
        requested,
        resolved,
        gitSpec,
        suggestions,
        releases,
        prereleases,
      };
    }).catch(error => {
      const response = {
        source: ClientResponseSource.remote,
        data: error.message,
        status: error.code
      };
      return Promise.reject(ResponseFactory.createUnexpected(
        NpmConfig.provider,
        request.package,
        response,
      ));
    });
}

function getSourceFromNpaResult(npaResult): PackageSourceTypes {
  if (npaResult.type === "git")
    return PackageSourceTypes.git;
  else if (npaResult.type === "alias")
    return PackageSourceTypes.registry;
  else
    return PackageSourceTypes.registry;
}

function getVersionTypeFromNpaResult(npaResult): PackageVersionTypes {
  if (npaResult.type === "git") {
    if (npaResult.gitRange)
      return PackageVersionTypes.range;
    else if (npaResult.gitCommittish)
      return PackageVersionTypes.committish;
    else {
      // branch type ?
    }
  }
  else if (npaResult.type === "alias")
    return npaResult.type;
  else
    return npaResult.type;
}

function getRangeFromNpaResult(npaResult): string {
  if (npaResult.type === PackageSourceTypes.git) {
    if (npaResult.gitRange) {
      return npaResult.gitRange;
    } else if (npaResult.gitCommittish) {
      return npaResult.gitCommittish;
    } else {
      return npaResult.rawSpec;
    }
  } else if (npaResult.type === PackageVersionTypes.alias) {
    return npaResult.subSpec.rawSpec;
  } else {
    return npaResult.rawSpec;
  }
}

// factory methods
export const fileDependencyRegex = /^file:(.*)$/;
function createDirectoryPackageDocument(requested: PackageIdentifier, response: PackageResponseStatus, npaResult: any): PackageDocument {

  const fileRegExpResult = fileDependencyRegex.exec(requested.version);
  if (!fileRegExpResult) {
    return DocumentFactory.createInvalidVersion(
      NpmConfig.provider,
      requested,
      response,
      npaResult.type
    );
  }

  const source = PackageSourceTypes.directory;
  const type = PackageVersionTypes.version;

  const resolved = {
    name: npaResult.name,
    version: fileRegExpResult[1],
  };

  const suggestions: Array<PackageSuggestion> = [
    {
      name: 'file://',
      version: resolved.version,
      flags: PackageSuggestionFlags.prerelease
    },
  ]

  return {
    provider: NpmConfig.provider,
    source,
    type,
    requested,
    response,
    resolved,
    suggestions
  };
}
