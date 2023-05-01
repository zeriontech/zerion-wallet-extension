export interface Credentials {
  id: string;
  encryptionKey: string;
  /**
   * Even though "deprecated", we might never remove this field
   * in order to always support users coming back from before <1.0.0-alpha.39
   */
  seedPhraseEncryptionKey_deprecated: CryptoKey | null;
  seedPhraseEncryptionKey: string | null;
}

export interface SessionCredentials extends Credentials {
  seedPhraseEncryptionKey_deprecated: CryptoKey;
  seedPhraseEncryptionKey: string;
}

export function isSessionCredentials(
  x: Credentials | SessionCredentials
): x is SessionCredentials {
  return Boolean(
    x.seedPhraseEncryptionKey && x.seedPhraseEncryptionKey_deprecated
  );
}
