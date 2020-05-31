import { LoggerStub } from 'test.core.logging';

import { PackageSuggestionFlags } from 'core.packages';
import { ILogger } from 'core.logging';

import {
  NpmConfig,
  NpmPackageClient,
  GitHubOptions
} from 'infrastructure.providers/npm'

import {
  ICachingOptions,
  CachingOptions,
  IHttpOptions,
  HttpOptions,
  ClientResponseSource
} from 'core.clients';

import { VersionLensExtension } from 'presentation.extension';

import { githubFixtures } from './fetchGithub.fixtures'

const { mock, instance, when } = require('ts-mockito');

const assert = require('assert')
const requireMock = require('mock-require')

let requestLightMock = null

let extensionMock: VersionLensExtension;
let cacheOptsMock: ICachingOptions;
let httpOptsMock: IHttpOptions;
let githubOptsMock: GitHubOptions;
let loggerMock: ILogger;

export default {

  beforeAll: () => {
    // mock require modules
    requestLightMock = {}
    requireMock('request-light', requestLightMock)
  },

  afterAll: () => requireMock.stopAll(),

  beforeEach: () => {
    extensionMock = mock(VersionLensExtension);
    cacheOptsMock = mock(CachingOptions);
    httpOptsMock = mock(HttpOptions);
    githubOptsMock = mock(GitHubOptions);
    loggerMock = mock(LoggerStub);
  },

  'fetchGithubPackage': {

    'returns a #semver:x.x.x. package': async () => {

      const testRequest: any = {
        providerName: 'testnpmprovider',
        package: {
          path: 'packagepath',
          name: 'core.js',
          version: 'github:octokit/core.js#semver:^2',
        }
      };

      requestLightMock.xhr = options => {
        return Promise.resolve({
          status: 200,
          responseText: JSON.stringify(githubFixtures.tags),
          source: ClientResponseSource.remote
        })
      };

      // setup initial call
      const cut = new NpmPackageClient(
        new NpmConfig(
          instance(extensionMock),
          instance(cacheOptsMock),
          instance(httpOptsMock),
          instance(githubOptsMock),
        ),
        instance(loggerMock)
      );

      return cut.fetchPackage(testRequest)
        .then((actual) => {
          assert.equal(actual.source, 'github')
          assert.equal(actual.type, 'range')
          assert.equal(actual.resolved.name, testRequest.package.name)
          assert.deepEqual(actual.requested, testRequest.package)

          assert.deepEqual(
            actual.suggestions,
            [{
              name: 'satisfies',
              version: 'latest',
              flags: PackageSuggestionFlags.status
            }, {
              name: 'latest',
              version: 'v2.5.0',
              flags: PackageSuggestionFlags.release
            }, {
              name: 'rc',
              version: 'v2.6.0-rc.1',
              flags: PackageSuggestionFlags.prerelease
            }, {
              name: 'preview',
              version: 'v2.5.0-preview.1',
              flags: PackageSuggestionFlags.prerelease
            }]
          )
        })
    },

    'returns a #x.x.x': async () => {

      const testRequest: any = {
        providerName: 'testnpmprovider',
        package: {
          path: 'packagepath',
          name: 'core.js',
          version: 'github:octokit/core.js#v2.0.0',
        }
      };

      requestLightMock.xhr = options => {
        return Promise.resolve({
          status: 200,
          responseText: JSON.stringify(githubFixtures.tags),
          source: ClientResponseSource.remote
        })
      };

      // setup initial call
      const cut = new NpmPackageClient(
        new NpmConfig(
          instance(extensionMock),
          instance(cacheOptsMock),
          instance(httpOptsMock),
          instance(githubOptsMock),
        ),
        instance(loggerMock)
      );

      return cut.fetchPackage(testRequest)
        .then((actual) => {
          assert.equal(actual.source, 'github')
          assert.equal(actual.type, 'range')
          assert.equal(actual.providerName, testRequest.providerName)
          assert.equal(actual.resolved.name, testRequest.package.name)
          assert.deepEqual(actual.requested, testRequest.package)

          assert.deepEqual(
            actual.suggestions,
            [{
              name: 'fixed',
              version: 'v2.0.0',
              flags: PackageSuggestionFlags.status
            }, {
              name: 'latest',
              version: 'v2.5.0',
              flags: PackageSuggestionFlags.release
            }, {
              name: 'rc',
              version: 'v2.6.0-rc.1',
              flags: PackageSuggestionFlags.prerelease
            }, {
              name: 'preview',
              version: 'v2.5.0-preview.1',
              flags: PackageSuggestionFlags.prerelease
            }]
          )
        })
    },

    'returns a #sha commit': async () => {

      const testRequest: any = {
        providerName: 'testnpmprovider',
        package: {
          path: 'packagepath',
          name: 'core.js',
          version: 'github:octokit/core.js#166c3497',
        }
      };

      requestLightMock.xhr = options => {
        return Promise.resolve({
          status: 200,
          responseText: JSON.stringify(githubFixtures.commits),
          source: ClientResponseSource.remote
        })
      };

      // setup initial call
      const cut = new NpmPackageClient(
        new NpmConfig(
          instance(extensionMock),
          instance(cacheOptsMock),
          instance(httpOptsMock),
          instance(githubOptsMock),
        ),
        instance(loggerMock)
      );

      return cut.fetchPackage(testRequest)
        .then((actual) => {
          assert.equal(actual.source, 'github')
          assert.equal(actual.type, 'committish')
          assert.equal(actual.providerName, testRequest.providerName)
          assert.equal(actual.resolved.name, testRequest.package.name)
          assert.deepEqual(actual.requested, testRequest.package)

          assert.deepEqual(
            actual.suggestions,
            [{
              name: 'fixed',
              version: '166c3497',
              flags: PackageSuggestionFlags.status
            }, {
              name: 'latest',
              version: 'df4d9435',
              flags: PackageSuggestionFlags.release
            }]
          )
        })
    },

    'sets auth token in headers': async () => {

      const testRequest: any = {
        providerName: 'testnpmprovider',
        package: {
          path: 'packagepath',
          name: 'core.js',
          version: 'github:octokit/core.js#166c3497',
        }
      };

      const testToken = 'testToken';

      requestLightMock.xhr = options => {
        const actual = options.headers['authorization'];
        assert.equal(actual, 'token ' + testToken)

        return Promise.resolve({
          status: 200,
          responseText: JSON.stringify(githubFixtures.commits),
          source: ClientResponseSource.remote
        })
      };

      when(githubOptsMock.accessToken).thenReturn(testToken);

      // setup initial call
      const cut = new NpmPackageClient(
        new NpmConfig(
          instance(extensionMock),
          instance(cacheOptsMock),
          instance(httpOptsMock),
          instance(githubOptsMock),
        ),
        instance(loggerMock)
      );

      return cut.fetchPackage(testRequest);
    }

  }

}