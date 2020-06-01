export type TProcessSpawnOptions = {
  cwd?: string,
  stdioString?: boolean,
  stdio?: string
}

export type TProcessSpawnResult = {
  code: any,
  stdout: any,
  stderr: any,
  signal: any,
  extra: any
}

export interface IProcessSpawnFn {
  (
    cmd: string,
    args?: Array<string>,
    opts?: TProcessSpawnOptions,
    extra?: any
  ): Promise<TProcessSpawnResult>
}