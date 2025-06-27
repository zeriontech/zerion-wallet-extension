import {
  arrayBufferToBase64,
  arrayBufferToUtf8,
  base64ToArrayBuffer,
  createSalt,
  getRandomUint8Array,
  utf8ToUint8Array,
} from 'src/modules/crypto';
import { sha256 } from 'src/modules/crypto/sha256';
import { accountPublicRPCPort } from 'src/ui/shared/channels';

export async function setupAccountPasskey(password: string) {
  const salt = createSalt();
  const cred = await navigator.credentials.create({
    publicKey: {
      rp: { name: 'Zerion' },
      user: {
        id: getRandomUint8Array(8),
        name: 'zerion',
        displayName: 'Zerion Wallet',
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      challenge: getRandomUint8Array(6),
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

  return accountPublicRPCPort.request('setPasskey', {
    password,
    encryptionKey,
    id: passkeyId,
    salt,
  });
}

export async function getPasswordWithPasskey() {
  const data = await accountPublicRPCPort.request('getPasskeyMeta');
  if (!data) {
    throw new Error('No passkey found');
  }
  const { id: passkeyId, salt } = data;
  const cred = await navigator.credentials.get({
    publicKey: {
      challenge: getRandomUint8Array(32),
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

  return accountPublicRPCPort.request('getPassword', { encryptionKey });
}
