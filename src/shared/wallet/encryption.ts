import type { SessionCredentials } from 'src/background/account/Credentials';
import { decryptObject } from 'src/modules/crypto/aes';
import { stableDecryptObject } from 'src/modules/crypto/aesStable';
import { getSHA256HexDigest } from 'src/modules/crypto/getSHA256HexDigest';
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

export async function seedPhraseToHash(phrase: string) {
  /**
   * Storing hash of the seed phrase is considered ok, because using a brute-force search
   * to find phrase by hash makes little sense: you could brute-force phrases to get actual
   * private keys or addresses instead.
   * (https://zeriontech.slack.com/archives/C03EJB0AJ8M/p1682978582012569)
   *
   * * We add a version to the output hash to be able to update hashing algorithm later
   * * We mix in an additional non BIP-32 word to the input, even though hashing an unmodified seed phrase should be safe given the above
   */
  const VERSION = '1';
  const NON_BIP_32_WORD = 'synthwave';
  const message = `${NON_BIP_32_WORD}${phrase}`;
  const hash = await getSHA256HexDigest(message);
  return `${VERSION}:${hash}`;
}
