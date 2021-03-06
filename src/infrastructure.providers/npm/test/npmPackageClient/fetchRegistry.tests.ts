import { LoggerStub } from 'test.core.logging';

import { ClientResponseSource } from 'core.clients';

import { PackageSuggestionFlags } from 'core.packages';

import {
  NpmConfig,
  NpmPackageClient,
  GitHubClient,
  PacoteClient
} from 'infrastructure.providers.npm'

const { mock, instance, when, anything } = require('ts-mockito');

const assert = require('assert')

let configMock: NpmConfig;
let pacoteMock: PacoteClient;
let githubClientMock: GitHubClient;
let loggerMock: LoggerStub;

export default {

  beforeEach: () => {
    configMock = mock(NpmConfig);
    pacoteMock = mock(PacoteClient);
    githubClientMock = mock(GitHubClient);
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
        instance(configMock),
        instance(pacoteMock),
        instance(githubClientMock),
        instance(loggerMock)
      );

      return testStates.forEach(async testState => {

        when(pacoteMock.fetchPackage(anything(), anything()))
          .thenReject({
            status: testState.status,
            data: "response",
            source: ClientResponseSource.remote
          })

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
          .catch(e => console.error(e))

      })

    }

  }

}