export interface StableEncrypted {
  data: string;
  version: number;
}

export interface Encrypted extends StableEncrypted {
  salt: string;
  iv: string;
}
