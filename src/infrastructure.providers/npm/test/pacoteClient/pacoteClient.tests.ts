import { LoggerStub } from 'test.core.logging';

import { ILogger } from 'core.logging';
import { PackageSuggestionFlags } from 'core.packages';

import {
  ICachingOptions,
  CachingOptions,
  IHttpOptions,
  HttpOptions
} from 'core.clients';

import {
  NpmConfig,
  PacoteClient,
  GitHubOptions
} from 'infrastructure.providers/npm'

import { VersionLensExtension } from 'presentation.extension';

import Fixtures from './pacoteClient.fixtures'

const { mock, instance } = require('ts-mockito');

const assert = require('assert')
const requireMock = require('mock-require')
const npa = require('npm-package-arg');

let pacoteMock = null

let extensionMock: VersionLensExtension;
let cacheOptsMock: ICachingOptions;
let httpOptsMock: IHttpOptions;
let githubOptsMock: GitHubOptions;
let loggerMock: ILogger;

export default {

  beforeAll: () => {
    pacoteMock = {
      packument: {}
    }

    requireMock('pacote', pacoteMock)
  },

  afterAll: () => requireMock.stopAll(),

  beforeEach: () => {
    // mock defaults
    pacoteMock.packument = (npaResult, opts) => { }

    extensionMock = mock(VersionLensExtension);
    cacheOptsMock = mock(CachingOptions);
    httpOptsMock = mock(HttpOptions);
    githubOptsMock = mock(GitHubOptions);
    loggerMock = mock(LoggerStub);
  },

  'fetchPackage': {

    'returns a registry range package': async () => {

      const testRequest: any = {
        clientData: {
          providerName: 'testnpmprovider',
        },
        package: {
          path: 'packagepath',
          name: 'pacote',
          version: '10.1.*',
        }
      }

      const npaSpec = npa.resolve(
        testRequest.package.name,
        testRequest.package.version,
        testRequest.package.path
      );

      // setup initial call
      pacoteMock.packument = (npaResult, opts) => Promise.resolve(Fixtures.packumentRegistryRange);
      const cut = new PacoteClient(
        new NpmConfig(
          instance(extensionMock),
          instance(cacheOptsMock),
          instance(httpOptsMock),
          instance(githubOptsMock),
        ),
        instance(loggerMock)
      );
      return cut.fetchPackage(testRequest, npaSpec)
        .then((actual) => {
          assert.equal(actual.source, 'registry')
          assert.equal(actual.type, 'range')
          assert.equal(actual.resolved.name, testRequest.package.name)
          assert.deepEqual(actual.requested, testRequest.package)
        })
    },

    'returns a registry version package': async () => {

      const testRequest: any = {
        clientData: {
          providerName: 'testnpmprovider',
        },
        package: {
          path: 'packagepath',
          name: 'npm-package-arg',
          version: '8.0.1',
        }
      }

      const npaSpec = npa.resolve(
        testRequest.package.name,
        testRequest.package.version,
        testRequest.package.path
      );

      // setup initial call
      pacoteMock.packument = (npaResult, opts) => Promise.resolve(Fixtures.packumentRegistryVersion);
      const cut = new PacoteClient(
        new NpmConfig(
          instance(extensionMock),
          instance(cacheOptsMock),
          instance(httpOptsMock),
          instance(githubOptsMock),
        ),
        instance(loggerMock)
      );
      return cut.fetchPackage(testRequest, npaSpec)
        .then((actual) => {
          assert.equal(actual.source, 'registry')
          assert.equal(actual.type, 'version')
          assert.equal(actual.resolved.name, testRequest.package.name)
        })
    },

    'returns capped latest versions': async () => {

      const testRequest: any = {
        clientData: {
          providerName: 'testnpmprovider',
        },
        package: {
          path: 'packagepath',
          name: 'npm-package-arg',
          version: '7.0.0',
        }
      }

      const npaSpec = npa.resolve(
        testRequest.package.name,
        testRequest.package.version,
        testRequest.package.path
      );

      // setup initial call
      pacoteMock.packument = (npaResult, opts) =>
        Promise.resolve(Fixtures.packumentCappedToLatestTaggedVersion);

      const cut = new PacoteClient(
        new NpmConfig(
          instance(extensionMock),
          instance(cacheOptsMock),
          instance(httpOptsMock),
          instance(githubOptsMock),
        ),
        instance(loggerMock)
      );
      return cut.fetchPackage(testRequest, npaSpec)
        .then((actual) => {
          assert.deepEqual(actual.suggestions, [{
            name: 'latest',
            version: '',
            flags: PackageSuggestionFlags.status
          }])
        })
    },

    'returns a registry alias package': async () => {
      const testRequest: any = {
        clientData: {
          providerName: 'testnpmprovider',
        },
        package: {
          path: 'packagepath',
          name: 'aliased',
          version: 'npm:pacote@11.1.9',
        }
      }

      const npaSpec = npa.resolve(
        testRequest.package.name,
        testRequest.package.version,
        testRequest.package.path
      );

      // setup initial call
      pacoteMock.packument = (npaResult, opts) => Promise.resolve(Fixtures.packumentRegistryAlias);
      const cut = new PacoteClient(
        new NpmConfig(
          instance(extensionMock),
          instance(cacheOptsMock),
          instance(httpOptsMock),
          instance(githubOptsMock),
        ),
        instance(loggerMock)
      );
      return cut.fetchPackage(testRequest, npaSpec)
        .then((actual) => {
          assert.equal(actual.source, 'registry')
          assert.equal(actual.type, 'alias')
          assert.equal(actual.requested.name, testRequest.package.name)
          assert.equal(actual.resolved.name, 'pacote')
          assert.deepEqual(actual.requested, testRequest.package)
        })
    },

  }

}