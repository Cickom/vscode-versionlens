import { LoggerStub } from 'test.core.logging';

import {
  ICachingOptions,
  CachingOptions,
  IHttpOptions,
  HttpOptions
} from 'core.clients';

import {
  NpmConfig,
  NpmPackageClient,
  GitHubOptions
} from 'infrastructure.providers/npm'

import { VersionLensExtension } from 'presentation.extension';

const { mock, instance } = require('ts-mockito');

const assert = require('assert')
const requireMock = require('mock-require')

let extensionMock: VersionLensExtension;
let cacheOptsMock: ICachingOptions;
let httpOptsMock: IHttpOptions;
let githubOptsMock: GitHubOptions;
let loggerMock: LoggerStub;

export default {

  afterAll: () => requireMock.stopAll(),

  beforeEach: () => {
    extensionMock = mock(VersionLensExtension)
    cacheOptsMock = mock(CachingOptions);
    httpOptsMock = mock(HttpOptions);
    githubOptsMock = mock(GitHubOptions);
    loggerMock = mock(LoggerStub);
  },

  'fetchPackage': {

    'returns a file:// directory package': async () => {
      const expectedSource = 'directory';

      const testRequest: any = {
        clientData: {
          providerName: 'testnpmprovider',
        },
        source: 'npmtest',
        package: {
          path: 'filepackagepath',
          name: 'filepackage',
          version: 'file://some/path/out/there',
        }
      }

      const cut = new NpmPackageClient(
        new NpmConfig(
          instance(extensionMock),
          instance(cacheOptsMock),
          instance(httpOptsMock),
          instance(githubOptsMock)
        ),
        instance(loggerMock)
      );

      return cut.fetchPackage(testRequest)
        .then(actual => {
          assert.equal(actual.source, 'directory', `expected to see ${expectedSource}`)
          assert.deepEqual(actual.requested, testRequest.package)
        })
    }

  }

}