import { TProcessSpawnOptions, TProcessSpawnResult } from "infrastructure.clients";

export class ProcessSpawnStub {

  ps(
    cmd: string,
    args?: Array<string>,
    opts?: TProcessSpawnOptions,
    // extra?: any
  ): Promise<TProcessSpawnResult> {
    return Promise.resolve() as any;
  }

}