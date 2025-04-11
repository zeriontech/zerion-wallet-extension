import { sha256 } from 'src/background/account/Account';
import {
  arrayBufferToBase64,
  arrayBufferToUtf8,
  base64ToArrayBuffer,
  createSalt,
  utf8ToUint8Array,
} from 'src/modules/crypto';
import { walletPort } from 'src/ui/shared/channels';

export async function createPasskeyForPassword(password: string) {
  const salt = createSalt();
  const cred = await navigator.credentials.create({
    publicKey: {
      rp: { name: 'Zerion' },
      user: {
        id: new Uint8Array([79, 252, 83, 72, 214, 7, 89, 26]),
        name: 'zerts',
        displayName: 'Zerts',
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      challenge: new Uint8Array([117, 61, 252, 231, 191, 241]),
      extensions: {
        prf: {
          eval: {
            first: utf8ToUint8Array(salt),
          },
        },
      },
    },
  });
  const rawId = (cred as PublicKeyCredential | undefined)?.rawId;
  const passkeyId = rawId ? arrayBufferToBase64(rawId) : null;
  if (!passkeyId) {
    throw new Error('Failed to get passkey ID');
  }

  const result = (cred as PublicKeyCredential).getClientExtensionResults?.();
  const prf = result?.prf?.results?.first as unknown as ArrayBuffer;
  if (!prf) {
    throw new Error('Failed to get PRF');
  }

  const encryptionKey = await sha256({
    salt,
    password: arrayBufferToUtf8(prf),
  });

  return walletPort.request('savePasswordWithPasskey', {
    password,
    encryptionKey,
    passkeyId,
    salt,
  });
}

export async function getPasswordWithPasskey() {
  const data = await walletPort.request('getEncryptedPasswordMeta');
  if (!data) {
    throw new Error('No passkey found');
  }
  const { id: passkeyId, salt } = data;
  const cred = await navigator.credentials.get({
    publicKey: {
      challenge: new Uint8Array([
        // must be a cryptographically random number sent from a server
        0x79, 0x50, 0x68, 0x71, 0xda, 0xee, 0xee, 0xb9, 0x94, 0xc3, 0xc2, 0x15,
        0x67, 0x65, 0x26, 0x22, 0xe3, 0xf3, 0xab, 0x3b, 0x78, 0x2e, 0xd5, 0x6f,
        0x81, 0x26, 0xe2, 0xa6, 0x01, 0x7d, 0x74, 0x50,
      ]),
      allowCredentials: [
        {
          id: base64ToArrayBuffer(passkeyId),
          type: 'public-key',
        },
      ],
      extensions: {
        prf: {
          eval: {
            first: utf8ToUint8Array(salt),
          },
        },
      },
    },
  });

  const result = (cred as PublicKeyCredential).getClientExtensionResults?.();
  const prf = result?.prf?.results?.first as unknown as ArrayBuffer;
  if (!prf) {
    throw new Error('Failed to get PRF');
  }

  const encryptionKey = await sha256({
    salt,
    password: arrayBufferToUtf8(prf),
  });

  return walletPort.request('getPasswordWithPasskey', { encryptionKey });
}
