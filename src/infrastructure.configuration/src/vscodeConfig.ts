import { IConfig, IFrozenOptions } from 'core.configuration';

// allows vscode configuration to be defrosted
// Useful for accessing hot changing values from settings.json
// Stays frozen until defrost() is called and then refrosts
export class VsCodeConfig implements IFrozenOptions {

  protected frozen: IConfig;

  section: string;

  constructor(extensionName: string) {
    this.section = extensionName;
    this.frozen = null;
  }

  protected get repo(): IConfig {
    const { workspace } = require('vscode');
    return workspace.getConfiguration(this.section);
  }

  get<T>(key: string): T {
    if (this.frozen === null) {
      this.frozen = this.repo;
    }

    return this.frozen.get(key);
  }

  defrost() {
    this.frozen = null;
  }

}