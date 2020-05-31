import { LoggerStub } from 'test.core.logging';

import { NpmConfig, NpmPackageClient, GitHubOptions } from 'infrastructure.providers/npm'

import {
  ClientResponseSource,
  ICachingOptions,
  CachingOptions,
  IHttpOptions,
  HttpOptions
} from 'core.clients';

import { PackageSuggestionFlags } from 'core.packages';

import { VersionLensExtension } from 'presentation.extension';

const { mock, instance } = require('ts-mockito');

const assert = require('assert')
const requireMock = require('mock-require')

let requestLightMock = null

let extensionMock: VersionLensExtension;
let cacheOptsMock: ICachingOptions;
let httpOptsMock: IHttpOptions;
let githubOptsMock: GitHubOptions;
let loggerMock: LoggerStub;

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

  'fetchPackage': {

    'returns 401, 404 and ECONNREFUSED suggestion statuses': async () => {
      const testRequest: any = {
        providerName: 'testnpmprovider',
        package: {
          path: 'packagepath',
          name: 'private-reg',
          version: '1.2.3',
        }
      };

      const testStates = [
        { status: 401, suggestion: { name: 'not authorized' } },
        { status: 404, suggestion: { name: 'package not found' } },
        { status: 'ECONNREFUSED', suggestion: { name: 'connection refused' } },
      ]

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

      return testStates.forEach(async testState => {

        requestLightMock.xhr = options => {
          return Promise.resolve({
            status: testState.status,
            responseText: "response",
            source: ClientResponseSource.remote
          })
        };

        await cut.fetchPackage(testRequest)
          .then((actual) => {
            assert.equal(actual.source, 'registry')
            assert.deepEqual(actual.requested, testRequest.package)

            assert.deepEqual(
              actual.suggestions,
              [{
                name: testState.suggestion.name,
                version: '',
                flags: PackageSuggestionFlags.status
              }]
            )
          })

      })

    }

  }

}