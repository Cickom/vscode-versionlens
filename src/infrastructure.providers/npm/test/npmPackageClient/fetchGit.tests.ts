import { NpmPackageClient, NpmConfig, GitHubOptions } from 'infrastructure.providers/npm';
import { LoggerStub } from 'test.core.logging';
import { VersionLensExtension } from 'presentation.extension';
import { ClientResponseSource, ICachingOptions, IHttpOptions, CachingOptions, HttpOptions } from 'core.clients';
import { PackageSuggestionFlags } from 'core.packages';
import { ILogger } from 'core.logging';

const { mock: Mock, instance } = require('ts-mockito');

const assert = require('assert')
const mock = require('mock-require')


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
    mock('request-light', requestLightMock)
  },

  afterAll: () => mock.stopAll(),

  beforeEach: () => {
    extensionMock = Mock(VersionLensExtension);
    cacheOptsMock = Mock(CachingOptions);
    httpOptsMock = Mock(HttpOptions);
    githubOptsMock = Mock(GitHubOptions);
    loggerMock = Mock(LoggerStub);
  },

  'fetchGitPackage': {

    'returns fixed package for git:// requests': async () => {

      const testRequest: any = {
        clientData: {
          providerName: 'testnpmprovider',
        },
        package: {
          path: 'packagepath',
          name: 'core.js',
          version: 'git+https://git@github.com/testuser/test.git',
        }
      };

      requestLightMock.xhr = options => {
        return Promise.resolve({
          status: 200,
          responseText: "",
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
          assert.equal(actual.source, 'git')
          assert.equal(actual.resolved, null)
          assert.deepEqual(actual.requested, testRequest.package)

          assert.deepEqual(
            actual.suggestions,
            [
              {
                name: 'fixed',
                version: 'git repository',
                flags: PackageSuggestionFlags.status
              }
            ]
          )

        })

    },

    'returns unsupported suggestion when not github': async () => {

      const testRequest: any = {
        clientData: {
          providerName: 'testnpmprovider',
        },
        package: {
          path: 'packagepath',
          name: 'core.js',
          version: 'git+https://git@not-gihub.com/testuser/test.git',
        }
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
          assert.deepEqual(
            actual.suggestions,
            [
              {
                name: 'not supported',
                version: '',
                flags: PackageSuggestionFlags.status
              }
            ]
          )
        })

    }

  }



}