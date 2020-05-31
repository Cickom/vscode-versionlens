import { LoggerStub } from 'test.core.logging'

import { ILogger } from 'core.logging'
import {
  ClientResponseSource,
  HttpClientRequestMethods,
  HttpRequestOptions,
} from 'core.clients'

import { JsonHttpClientRequest } from 'infrastructure.clients'

const { mock, instance } = require('ts-mockito');

const assert = require('assert')
const requireMock = require('mock-require')

let requestLightMock = null
let loggerMock: ILogger;

export const JsonClientRequestTests = {

  beforeAll: () => {
    // mock require modules
    requestLightMock = {}
    requireMock('request-light', requestLightMock)
  },

  afterAll: () => requireMock.stopAll(),

  beforeEach: () => {
    requestLightMock.xhr = _ => { throw new Error("Not implemented") }
    loggerMock = mock(LoggerStub);
  },

  "requestJson": {

    "returns response as an object": async () => {
      const testUrl = 'https://test.url.example/path';
      const testQueryParams = {}
      const testResponse = {
        source: ClientResponseSource.remote,
        status: 404,
        responseText: '{ "item1": "not found" }',
      };

      const expectedCacheData = {
        source: ClientResponseSource.remote,
        status: testResponse.status,
        data: JSON.parse(testResponse.responseText),
      }

      requestLightMock.xhr = options => {
        return Promise.resolve(testResponse)
      };

      const rut = new JsonHttpClientRequest(
        instance(loggerMock),
        <HttpRequestOptions>{
          caching: { duration: 30000 },
          http: { strictSSL: true }
        }
      );

      await rut.requestJson(
        HttpClientRequestMethods.get,
        testUrl,
        testQueryParams
      )
        .then(response => {
          assert.deepEqual(response, expectedCacheData);
        })
    },

  },

};