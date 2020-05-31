import { testPath } from 'test.core.testing';
import { LoggerStub } from 'test.core.logging';

import { ILogger } from 'core.logging';

import {
  IHttpOptions,
  ICachingOptions,
  CachingOptions,
  HttpOptions
} from 'core.clients';

import { VersionLensExtension } from 'presentation.extension';

import {
  NpmConfig,
  PacoteClient,
  GitHubOptions
} from 'infrastructure.providers/npm'

import Fixtures from './pacoteClient.fixtures'

const { mock, instance } = require('ts-mockito');

const assert = require('assert')
const path = require('path')
const requireMock = require('mock-require')
const npa = require('npm-package-arg');
const fs = require('fs');

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
    loggerMock = mock(LoggerStub)
  },

  'fetchPackage': {

    'uses npmrc registry': async () => {
      const packagePath = path.join(
        testPath,
        './src/infrastructure.providers/npm/test/fixtures/config'
      );

      const testRequest: any = {
        clientData: {
          providerName: 'testnpmprovider',
        },
        source: 'npmtest',
        package: {
          path: packagePath,
          name: 'aliased',
          version: 'npm:pacote@11.1.9',
        },
      }

      // write the npmrc file
      const npmrcPath = packagePath + '/.npmrc';
      fs.writeFileSync(npmrcPath, Fixtures[".npmrc"])
      assert.ok(require('fs').existsSync(testRequest.package.path), 'test .npmrc doesnt exist?')

      // setup initial call
      pacoteMock.packument = async (npaResult, opts) => {
        assert.equal(opts.cwd, testRequest.package.path)
        assert.equal(opts['//registry.npmjs.example/:_authToken'], '12345678')
        return Fixtures.packumentGit
      }

      const cut = new PacoteClient(
        new NpmConfig(
          instance(extensionMock),
          instance(cacheOptsMock),
          instance(httpOptsMock),
          instance(githubOptsMock),
        ),
        instance(loggerMock)
      );

      const npaSpec = npa.resolve(
        testRequest.package.name,
        testRequest.package.version,
        testRequest.package.path
      );

      return cut.fetchPackage(testRequest, npaSpec)
        .then(_ => {
          // delete the npmrc file
          fs.unlinkSync(npmrcPath)
        });
    },

  }

}