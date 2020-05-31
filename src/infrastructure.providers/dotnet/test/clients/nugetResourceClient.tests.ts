import Fixtures from './fixtures/nugetResources'

import { LoggerStub } from 'test.core.logging'

import { ILogger } from 'core.logging';

import {
  UrlHelpers,
  ICachingOptions,
  IHttpOptions,
  CachingOptions,
  HttpOptions
} from 'core.clients';

import {
  DotNetConfig,
  NuGetResourceClient,
  INugetOptions
} from 'infrastructure.providers/dotnet';

import { NugetOptions } from 'infrastructure.providers/dotnet';

import { VersionLensExtension } from 'presentation.extension';

const requireMock = require('mock-require');

const assert = require('assert');
const { mock, instance, when } = require('ts-mockito');

let extensionMock: VersionLensExtension;
let cacheOptsMock: ICachingOptions;
let httpOptsMock: IHttpOptions;
let nugetOptsMock: INugetOptions;
let loggerMock: ILogger;

export const NuGetResourceClientTests = {

  beforeEach: () => {
    extensionMock = mock(VersionLensExtension)
    cacheOptsMock = mock(CachingOptions);
    httpOptsMock = mock(HttpOptions);
    nugetOptsMock = mock(NugetOptions);
    loggerMock = mock(LoggerStub);
  },

  //  reset mocks
  afterEach: () => requireMock.stop('request-light'),

  "fetchResource": {

    "returns the package resource from a list of resources": async () => {
      const testSource = {
        enabled: true,
        machineWide: false,
        url: 'https://test',
        protocol: UrlHelpers.RegistryProtocols.https
      };

      const mockResponse = {
        status: 200,
        responseText: JSON.stringify(Fixtures.success),
      };

      const expected = 'https://api.nuget.org/v3-flatcontainer1/';

      requireMock('request-light', {
        xhr: options => {
          assert.equal(options.url, testSource.url)
          return Promise.resolve(mockResponse)
        }
      })

      // setup test feeds
      const config = new DotNetConfig(
        instance(extensionMock),
        instance(cacheOptsMock),
        instance(httpOptsMock),
        instance(nugetOptsMock)
      )

      const cut = new NuGetResourceClient(
        config,
        instance(loggerMock)
      )

      return cut.fetchResource(testSource)
        .then(actualSources => {
          assert.equal(actualSources, expected)
        });
    },

    "throws an error when no resource or feeds can be obtained": async () => {

      const testSource = {
        enabled: true,
        machineWide: false,
        url: 'https://test',
        protocol: UrlHelpers.RegistryProtocols.https
      };

      const mockResponse = {
        status: 404,
        responseText: 'an error occurred',
      };

      const expectedResponse = {
        source: 'remote',
        status: 404,
        data: 'an error occurred',
        rejected: true
      };

      requireMock('request-light', { xhr: () => Promise.reject(mockResponse) })

      when(nugetOptsMock.sources).thenReturn([])

      // setup test feeds
      const config = new DotNetConfig(
        instance(extensionMock),
        instance(cacheOptsMock),
        instance(httpOptsMock),
        instance(nugetOptsMock)
      )

      const cut = new NuGetResourceClient(
        config,
        instance(loggerMock)
      )
      await cut.fetchResource(testSource)
        .catch(err => {
          assert.deepEqual(err, expectedResponse)
        });
    },

  }

}