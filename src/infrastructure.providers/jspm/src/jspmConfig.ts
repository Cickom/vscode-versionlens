import { ICachingOptions, IHttpOptions } from 'core.clients';
import { VersionLensExtension } from 'presentation.extension';
import { NpmConfig, GitHubOptions } from 'infrastructure.providers/npm';

export class JspmConfig extends NpmConfig {

  constructor(
    extension: VersionLensExtension,
    jspmCachingOptions: ICachingOptions,
    jspmHttpOptions: IHttpOptions,
    jspmGitHubOptions: GitHubOptions
  ) {
    super(extension, jspmCachingOptions, jspmHttpOptions, jspmGitHubOptions);
    this.options.providerName = 'jspm';
  }

}