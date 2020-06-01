import {
  AbstractCachedRequest,
  ClientResponseSource,
  ProcessClientResponse,
  IProcessClient,
  ICachingOptions
} from 'core.clients';
import { ILogger } from 'core.logging';

import { IProcessSpawnFn } from './definitions/iProcessSpawnFn';

export class ProcessClient extends AbstractCachedRequest<string, string>
  implements IProcessClient {

  ps: IProcessSpawnFn;

  logger: ILogger;

  constructor(processOpts: ICachingOptions, processLogger: ILogger) {
    super(processOpts);
    this.logger = processLogger;
    this.ps = require('@npmcli/promise-spawn');
  }

  async request(
    cmd: string, args: Array<string>, cwd: string
  ): Promise<ProcessClientResponse> {

    const cacheKey = `${cmd} ${args.join(' ')}`;

    if (this.cache.cachingOpts.duration > 0 &&
      this.cache.hasExpired(cacheKey) === false) {
      this.logger.debug('cached - %s', cacheKey);

      const cachedResp = this.cache.get(cacheKey);
      if (cachedResp.rejected) return Promise.reject(cachedResp);
      return Promise.resolve(cachedResp);
    }

    this.logger.debug('executing - %s', cacheKey);

    return this.ps(cmd, args, { cwd, stdioString: true })
      .then(result => {
        return this.createCachedResponse(
          cacheKey,
          result.code,
          result.stdout,
          false,
          ClientResponseSource.local
        );
      }).catch(error => {
        const result = this.createCachedResponse(
          cacheKey,
          error.code,
          error.message,
          true,
          ClientResponseSource.local
        );
        return Promise.reject<ProcessClientResponse>(result);
      });

  }

}