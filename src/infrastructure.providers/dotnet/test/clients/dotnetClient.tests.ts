import Fixtures from './fixtures/dotnetSources'

import { LoggerStub } from 'test.core.logging';

import { ILogger } from 'core.logging';

import {
  UrlHelpers,
  ICachingOptions,
  CachingOptions,
  IHttpOptions,
  HttpOptions
} from 'core.clients';

import {
  DotNetConfig,
  DotNetClient,
  INugetOptions,
  NugetOptions
} from 'infrastructure.providers/dotnet';

import { VersionLensExtension } from 'presentation.extension';


const { mock, instance, when } = require('ts-mockito');

const assert = require('assert');
const requireMock = require('mock-require');

let extensionMock: VersionLensExtension;
let cacheOptsMock: ICachingOptions;
let httpOptsMock: IHttpOptions;
let nugetOptsMock: INugetOptions;
let loggerMock: ILogger;

export const DotnetClientRequestTests = {

  beforeEach: () => {
    extensionMock = mock(VersionLensExtension);
    cacheOptsMock = mock(CachingOptions);
    httpOptsMock = mock(HttpOptions);
    nugetOptsMock = mock(NugetOptions);
    loggerMock = mock(LoggerStub)
  },

  // reset all require mocks
  afterEach: () => requireMock.stop('@npmcli/promise-spawn'),

  "fetchSources": {

    "returns an Array<DotNetSource> of enabled sources": async () => {
      const testFeeds = [
        'https://test.feed/v3/index.json',
      ];

      const expected = [
        {
          enabled: true,
          machineWide: false,
          url: testFeeds[0],
          protocol: UrlHelpers.RegistryProtocols.https
        },
        {
          enabled: true,
          machineWide: false,
          url: 'https://api.nuget.org/v3/index.json',
          protocol: UrlHelpers.RegistryProtocols.https
        },
        {
          enabled: true,
          machineWide: false,
          url: 'http://non-ssl/v3/index.json',
          protocol: UrlHelpers.RegistryProtocols.http
        },
        {
          enabled: true,
          machineWide: true,
          url: 'C:\\Program Files (x86)\\Microsoft SDKs\\NuGetPackages\\',
          protocol: UrlHelpers.RegistryProtocols.file
        },
      ]

      let promiseSpawnMock = (cmd, args, opts) => {
        return Promise.resolve({
          code: 0,
          stdout: Fixtures.enabledSources
        });
      };
      requireMock('@npmcli/promise-spawn', promiseSpawnMock);

      when(nugetOptsMock.sources).thenReturn(testFeeds)

      // setup test feeds
      const config = new DotNetConfig(
        instance(extensionMock),
        instance(cacheOptsMock),
        instance(httpOptsMock),
        instance(nugetOptsMock),
      )

      const cut = new DotNetClient(
        config,
        instance(loggerMock)
      );
      return cut.fetchSources('.')
        .then(actualSources => {
          assert.deepEqual(actualSources, expected);
        });

    },

    "return 0 items when no sources are enabled": async () => {
      const testFeeds = [];

      let promiseSpawnMock = (cmd, args, opts) => {
        return Promise.resolve({
          code: 0,
          stdout: Fixtures.disabledSource
        });
      };
      requireMock('@npmcli/promise-spawn', promiseSpawnMock);

      when(nugetOptsMock.sources).thenReturn(testFeeds)

      // setup test feeds
      const config = new DotNetConfig(
        instance(extensionMock),
        instance(cacheOptsMock),
        instance(httpOptsMock),
        instance(nugetOptsMock),
      )

      const cut = new DotNetClient(
        config,
        instance(loggerMock)
      );
      return cut.fetchSources('.')
        .then(actualSources => {
          assert.equal(actualSources.length, 0);
        });
    },

    "returns only enabled sources when some sources are disabled": async () => {
      const expected = [
        {
          enabled: true,
          machineWide: false,
          url: 'https://api.nuget.org/v3/index.json',
          protocol: UrlHelpers.RegistryProtocols.https
        },
      ]

      let promiseSpawnMock = (cmd, args, opts) => {
        return Promise.resolve({
          code: 0,
          stdout: Fixtures.enabledAndDisabledSources
        });
      };
      requireMock('@npmcli/promise-spawn', promiseSpawnMock);

      // setup test feeds
      const config = new DotNetConfig(
        instance(extensionMock),
        instance(cacheOptsMock),
        instance(httpOptsMock),
        instance(nugetOptsMock),
      )

      const cut = new DotNetClient(
        config,
        instance(loggerMock)
      );

      return cut.fetchSources('.')
        .then(actualSources => {
          assert.deepEqual(actualSources, expected);
        });
    },

    "returns fallback url on error": async () => {

      let promiseSpawnMock = (cmd, args, opts) => {
        return Promise.reject({
          code: '0',
          stdout: Fixtures.invalidSources
        });
      };
      requireMock('@npmcli/promise-spawn', promiseSpawnMock);

      const config = new DotNetConfig(
        instance(extensionMock),
        instance(cacheOptsMock),
        instance(httpOptsMock),
        instance(nugetOptsMock),
      );

      const cut = new DotNetClient(
        config,
        instance(loggerMock)
      );

      const expectedErrorResp = {
        enabled: true,
        machineWide: false,
        protocol: 'https:',
        url: config.fallbackNugetSource,
      }

      return cut.fetchSources('.')
        .then(actual => {
          assert.deepEqual(actual, [expectedErrorResp]);
        });
    },

  }

}