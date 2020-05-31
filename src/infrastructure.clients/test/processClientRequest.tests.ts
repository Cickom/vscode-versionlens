import { LoggerStub } from 'test.core.logging';

import { ILogger } from 'core.logging';
import { ClientResponseSource, CachingOptions, ICachingOptions } from 'core.clients'

import { ProcessClientRequest } from 'infrastructure.clients'

const { mock, instance, when } = require('ts-mockito');

const assert = require('assert')
const requireMock = require('mock-require')

let cachingMock: ICachingOptions;
let loggerMock: ILogger;

export const ProcessClientRequestTests = {

  afterAll: () => requireMock.stopAll(),

  beforeEach: () => {
    // reset mocks
    requireMock.stop('@npmcli/promise-spawn');

    cachingMock = mock(CachingOptions)
    loggerMock = mock(LoggerStub)
  },

  "requestJson": {

    "returns <ProcessClientResponse> when error occurs": async () => {

      const promiseSpawnMock = (cmd, args, opts) => {
        return Promise.reject({
          code: "ENOENT",
          message: "spawn missing ENOENT"
        });
      };
      requireMock('@npmcli/promise-spawn', promiseSpawnMock);

      when(cachingMock.duration).thenReturn(30000)

      const rut = new ProcessClientRequest(
        instance(cachingMock),
        instance(loggerMock)
      );
      return await rut.request(
        'missing',
        ['--ooppss'],
        '/'
      ).catch(response => {
        assert.equal(response.status, "ENOENT")
        assert.equal(response.data, "spawn missing ENOENT")
      })

    },

    "returns <ProcessClientResponse> and caches response": async () => {
      const testResponse = {
        source: ClientResponseSource.local,
        status: 0,
        data: '123\n',
        rejected: false
      }

      const expectedCacheData = {
        source: ClientResponseSource.cache,
        status: testResponse.status,
        data: testResponse.data,
        rejected: false
      }

      const promiseSpawnMock = (cmd, args, opts) => {
        return Promise.resolve({
          code: 0,
          stdout: testResponse.data
        });
      };
      requireMock('@npmcli/promise-spawn', promiseSpawnMock)

      when(cachingMock.duration).thenReturn(30000)

      const rut = new ProcessClientRequest(
        instance(cachingMock),
        instance(loggerMock)
      )

      await rut.request(
        'echo',
        ['123'],
        'd:\\'
      ).then(response => {
        assert.deepEqual(response, testResponse)
      })

      await rut.request(
        'echo',
        ['123'],
        'd:\\'
      ).then(response => {
        assert.deepEqual(response, expectedCacheData)
      })

    },

    "doesn't cache when duration is 0": async () => {
      const testKey = 'echo 123';
      const testResponse = {
        source: ClientResponseSource.local,
        status: 0,
        data: '123\n',
        rejected: false,
      }

      const promiseSpawnMock = (cmd, args, opts) => {
        return Promise.resolve({
          code: 0,
          stdout: testResponse.data
        });
      };
      requireMock('@npmcli/promise-spawn', promiseSpawnMock);

      when(cachingMock.duration).thenReturn(0)

      const rut = new ProcessClientRequest(
        instance(cachingMock),
        instance(loggerMock)
      )

      await rut.request(
        'echo',
        ['123'],
        'd:\\'
      ).then(response => {
        assert.deepEqual(response, testResponse)
      })

      await rut.request(
        'echo',
        ['123'],
        'd:\\'
      ).then(response => {
        assert.deepEqual(response, testResponse)

        const cachedData = rut.cache.get(testKey);
        assert.equal(cachedData, undefined);
      })

    },

  },

};