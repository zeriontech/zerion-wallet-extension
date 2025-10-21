import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  createSalt,
  deriveEncryptionKeyFromPRF,
  getRandomUint8Array,
  utf8ToUint8Array,
} from 'src/modules/crypto';
import { accountPublicRPCPort } from 'src/ui/shared/channels';

interface PRFExtensionResult {
  prf?: {
    enabled?: boolean;
    results?: {
      first?: ArrayBuffer;
    };
  };
}

/**
 * Checks if the current browser and authenticator support the PRF extension.
 * This is critical for passkey-based password encryption.
 */
async function checkPRFSupport(): Promise<boolean> {
  try {
    // Check if WebAuthn is available
    if (!window.PublicKeyCredential) {
      return false;
    }

    // Check if platform authenticator is available
    const available =
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) {
      return false;
    }

    // PRF extension support cannot be directly detected, but we can verify
    // the browser supports the necessary WebAuthn features
    return true;
  } catch (error) {
    // PRF support check failed, return false without logging
    // Error will be shown to user if they attempt to set up passkey
    return false;
  }
}

/**
 * Type guard to validate PRF extension results
 */
function isPRFResultValid(
  result: unknown
): result is { prf: { results: { first: ArrayBuffer } } } {
  if (!result || typeof result !== 'object') {
    return false;
  }
  const prfResult = result as PRFExtensionResult;
  return !!(
    prfResult.prf?.results?.first instanceof ArrayBuffer &&
    prfResult.prf.results.first.byteLength > 0
  );
}

/**
 * Safely extracts PRF result from credential extension results
 */
function extractPRFResult(cred: unknown): ArrayBuffer {
  if (!cred || typeof cred !== 'object') {
    throw new Error(
      'Invalid credential object. Passkey authentication failed.'
    );
  }

  const credential = cred as PublicKeyCredential;
  if (typeof credential.getClientExtensionResults !== 'function') {
    throw new Error(
      'Browser does not support WebAuthn extensions. Please update your browser.'
    );
  }

  const result = credential.getClientExtensionResults();

  if (!isPRFResultValid(result)) {
    throw new Error(
      'PRF extension is not supported by your authenticator. ' +
        'This feature requires a compatible device with biometric authentication (Touch ID, Face ID, Windows Hello, etc.). ' +
        'Please try a different device or use password login instead.'
    );
  }

  // Type guard ensures this is safe
  return result.prf.results.first;
}

export async function setupAccountPasskey(password: string) {
  // Check PRF support before attempting setup
  const prfSupported = await checkPRFSupport();
  if (!prfSupported) {
    throw new Error(
      'Your device does not support passkey-based password encryption. ' +
        'Please ensure you are using a compatible browser and have platform authentication (Touch ID, Face ID, or Windows Hello) enabled.'
    );
  }

  const salt = createSalt();
  let cred: Credential | null;

  try {
    cred = await navigator.credentials.create({
      publicKey: {
        rp: { name: 'Zerion' },
        user: {
          id: getRandomUint8Array(32),
          name: 'zerion',
          displayName: 'Zerion Wallet',
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        challenge: getRandomUint8Array(32),
        extensions: {
          prf: {
            eval: {
              first: utf8ToUint8Array(salt),
            },
          },
        },
      },
    });
  } catch (error) {
    // Handle user cancellation or other creation errors
    if (error instanceof Error) {
      if (
        error.name === 'NotAllowedError' ||
        error.message.includes('cancelled')
      ) {
        throw new Error('Passkey setup was cancelled by user');
      }
      throw new Error(`Failed to create passkey: ${error.message}`);
    }
    throw new Error('Failed to create passkey due to an unknown error');
  }

  if (!cred) {
    throw new Error('Failed to create passkey: No credential returned');
  }

  const rawId = (cred as PublicKeyCredential | undefined)?.rawId;
  const passkeyId = rawId ? arrayBufferToBase64(rawId) : null;
  if (!passkeyId) {
    throw new Error('Failed to get passkey ID from credential');
  }

  // Use the safe PRF extraction with proper type guards
  const prf = extractPRFResult(cred);

  // Derive encryption key using HKDF for defense-in-depth
  // This ensures that even if the salt is compromised, the attacker still needs
  // the PRF output from the authenticator to derive the encryption key
  const encryptionKey = await deriveEncryptionKeyFromPRF(prf, salt);

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

  let cred: Credential | null;

  try {
    cred = await navigator.credentials.get({
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
  } catch (error) {
    // Handle user cancellation or authentication errors
    if (error instanceof Error) {
      if (
        error.name === 'NotAllowedError' ||
        error.message.includes('cancelled')
      ) {
        throw new Error('Authentication was cancelled by user');
      }
      if (error.name === 'InvalidStateError') {
        throw new Error(
          'Passkey not found on this device. Please use password login or set up passkey again.'
        );
      }
      throw new Error(`Authentication failed: ${error.message}`);
    }
    throw new Error('Authentication failed due to an unknown error');
  }

  if (!cred) {
    throw new Error('Authentication failed: No credential returned');
  }

  // Use the safe PRF extraction with proper type guards
  const prf = extractPRFResult(cred);

  // Derive encryption key using HKDF (same method as setup)
  const encryptionKey = await deriveEncryptionKeyFromPRF(prf, salt);

  return accountPublicRPCPort.request('getPassword', { encryptionKey });
}
