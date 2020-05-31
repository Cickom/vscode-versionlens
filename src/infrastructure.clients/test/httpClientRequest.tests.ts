import { LoggerStub } from 'test.core.logging'

import { ILogger } from 'core.logging';
import { KeyStringDictionary } from 'core.generics'
import {
  ClientResponseSource,
  UrlHelpers,
  HttpClientRequestMethods,
  HttpRequestOptions,
  ICachingOptions,
  IHttpOptions,
  CachingOptions,
  HttpOptions,
} from 'core.clients'

import { HttpClientRequest } from 'infrastructure.clients'

const { mock, instance, when } = require('ts-mockito');

const assert = require('assert')
const requireMock = require('mock-require')

let requestLightMock = null
let testContext = null

let cachingOptsMock: ICachingOptions;
let httpOptsMock: IHttpOptions;
let loggerMock: ILogger;

export const HttpRequestTests = {

  beforeAll: () => {
    testContext = {}
    // mock require modules
    requestLightMock = {}
    requireMock('request-light', requestLightMock)
  },

  afterAll: () => requireMock.stopAll(),

  beforeEach: () => {

    cachingOptsMock = mock(CachingOptions);
    httpOptsMock = mock(HttpOptions);
    loggerMock = mock(LoggerStub);

    const caching = when(cachingOptsMock.duration).thenReturn(30000);
    const http = when(httpOptsMock.strictSSL).thenReturn(true);

    testContext.rut = new HttpClientRequest(
      instance(loggerMock),
      <HttpRequestOptions>{
        caching,
        http
      }
    );

    requestLightMock.xhr = _ => { throw new Error("Not implemented") }
  },

  "request": {

    "passes options to xhr": async () => {

      const testFlags = [
        { testStrictSSL: true, testDuration: 3000 },
        { testStrictSSL: false, testDuration: 0 },
      ];

      return testFlags.forEach(async (test) => {

        requestLightMock.xhr = options => {
          assert.equal(options.strictSSL, test.testStrictSSL)
          return Promise.resolve({})
        };

        const caching = when(cachingOptsMock.duration)
          .thenReturn(test.testDuration);

        const http = when(httpOptsMock.strictSSL)
          .thenReturn(test.testStrictSSL);

        const rut = new HttpClientRequest(
          instance(loggerMock),
          <HttpRequestOptions>{ caching, http }
        );

        await rut.request(
          HttpClientRequestMethods.get,
          'anywhere'
        )

      })

    },

    "generates the expected url with query params": async () => {
      const testUrl = 'https://test.url.example/path';

      const testQueryParams = [
        {},
        { param1: 1, param2: 2 }
      ]

      await Promise.all(

        testQueryParams.map(async function (query: KeyStringDictionary) {
          const expectedUrl = UrlHelpers.createUrl(testUrl, query);
          requestLightMock.xhr = options => {
            assert.equal(options.url, expectedUrl);
            assert.equal(options.type, HttpClientRequestMethods.get);
            return Promise.resolve({
              status: 200,
              responseText: null
            })
          };

          return await testContext.rut.request(
            HttpClientRequestMethods.get,
            testUrl,
            query
          )
        })
      )

    },

    "caches url response on success": async () => {
      const testUrl = 'https://test.url.example/path';
      const testQueryParams = {}
      const testResponse = {
        source: ClientResponseSource.remote,
        status: 200,
        responseText: "cached test",
      };

      const expectedCacheData = {
        source: ClientResponseSource.cache,
        status: testResponse.status,
        data: testResponse.responseText,
        rejected: false
      }

      requestLightMock.xhr = options => {
        return Promise.resolve(testResponse)
      };

      await testContext.rut.request(
        HttpClientRequestMethods.get,
        testUrl,
        testQueryParams
      ).then(response => {
        const cachedData = testContext.rut.cache.get('GET_' + testUrl);
        assert.deepEqual(cachedData, expectedCacheData);
      })
    },

    "caches url response when rejected": async () => {
      const testUrl = 'https://test.url.example/path';
      const testQueryParams = {}
      const testResponse = {
        status: 404,
        responseText: "not found",
        source: ClientResponseSource.remote
      };

      const expectedCacheData = {
        status: testResponse.status,
        data: testResponse.responseText,
        source: ClientResponseSource.cache,
        rejected: true,
      }

      requestLightMock.xhr = options => {
        return Promise.reject(testResponse)
      };

      // first request
      await testContext.rut.request(
        HttpClientRequestMethods.get,
        testUrl,
        testQueryParams
      ).catch(response => {
        const cachedData = testContext.rut.cache.get('GET_' + testUrl);
        assert.deepEqual(cachedData, expectedCacheData);
      })

      // accessing a cached rejection should also reject
      await testContext.rut.request(
        HttpClientRequestMethods.get,
        testUrl,
        testQueryParams
      ).catch(response => {
        const cachedData = testContext.rut.cache.get('GET_' + testUrl);
        assert.deepEqual(cachedData, expectedCacheData);
      })

    },

    "does not cache when duration is 0": async () => {
      const testUrl = 'https://test.url.example/path';
      const testQueryParams = {}
      const expectedCacheData = undefined;
      requestLightMock.xhr = options => {
        return Promise.resolve({
          status: 200,
          data: JSON.stringify({ "message": "cached test" })
        })
      };

      testContext.rut = new HttpClientRequest(
        instance(loggerMock),
        <HttpRequestOptions>{
          caching: { duration: 0 },
          http: { strictSSL: true }
        }
      );

      await testContext.rut.request(
        HttpClientRequestMethods.get,
        testUrl,
        testQueryParams
      ).then(response => {
        const cachedData = testContext.rut.cache.get('GET_' + testUrl);
        assert.equal(cachedData, expectedCacheData);
      })
    },

  },

};