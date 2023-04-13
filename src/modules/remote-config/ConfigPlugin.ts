export interface ConfigPlugin {
  onRegister(): void;
  initialize(): void;
  get(key: string): undefined | { value: any };
}
