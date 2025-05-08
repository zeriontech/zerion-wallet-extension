import { decrypt, encrypt } from 'src/modules/crypto/aes';
import { BrowserStorage } from 'src/background/webapis/storage';

const ENCRYPTED_PASSWORD_KEY = 'passwordEncrypted-123';

export type EncryptedPassword = {
  encryptedPassword: string;
  salt: string;
  id: string;
};

export async function saveEncryptedPassword({
  password,
  encryptionKey,
  salt,
  id,
}: {
  password: string;
  encryptionKey: string;
  salt: string;
  id: string;
}) {
  const encrypted = await encrypt(encryptionKey, { password });
  await BrowserStorage.set(ENCRYPTED_PASSWORD_KEY, {
    encryptedPassword: encrypted,
    salt,
    id,
  });
}

export async function getEncryptedPasswordMeta() {
  return (
    (await BrowserStorage.get<EncryptedPassword>(ENCRYPTED_PASSWORD_KEY)) ||
    null
  );
}

export async function getPasswordWithPasskey(encryptionKey: string) {
  const data = await BrowserStorage.get<EncryptedPassword>(
    ENCRYPTED_PASSWORD_KEY
  );
  if (data) {
    const decrypted = await decrypt<{ password: string }>(
      encryptionKey,
      data.encryptedPassword
    );
    return decrypted.password;
  }
  return null;
}
