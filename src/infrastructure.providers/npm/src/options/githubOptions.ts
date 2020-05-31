import { IFrozenRepository, Nullable } from 'core.generics';
import { OptionsWithFallback } from 'core.configuration';
import { GitHubContributions } from '../definitions/eGitHubContributions';

export class GitHubOptions extends OptionsWithFallback {

  constructor(
    config: IFrozenRepository,
    section: string,
    fallbackSection: Nullable<string> = null
  ) {
    super(config, section, fallbackSection);
  }

  get accessToken(): string {
    return this.getOrDefault<string>(
      GitHubContributions.AccessToken,
      null
    );
  }

}