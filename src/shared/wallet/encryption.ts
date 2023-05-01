import type { SessionCredentials } from 'src/background/account/Credentials';
import { decryptObject } from 'src/modules/crypto/aes';
import { stableDecryptObject } from 'src/modules/crypto/aesStable';
import type { Encrypted, StableEncrypted } from 'src/modules/crypto/types';
import { isValidMnemonic } from 'src/shared/validation/wallet';

export function decryptMnemonic(data: string, credentials: SessionCredentials) {
  const encrypted = JSON.parse(data) as Encrypted | StableEncrypted;
  if ('iv' in encrypted) {
    return decryptObject<string>(
      credentials.seedPhraseEncryptionKey,
      encrypted
    );
  } else {
    return stableDecryptObject<string>(
      credentials.seedPhraseEncryptionKey_deprecated,
      encrypted
    );
  }
}

export function isEncryptedMnemonic(phrase: string) {
  // consider any non-valid mnemonic string to be encrypted
  return !isValidMnemonic(phrase);
}
