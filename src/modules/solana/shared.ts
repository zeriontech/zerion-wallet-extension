import bs58 from 'bs58';

export function isSolanaAddress(address: string) {
  try {
    return bs58.decode(address).length === 32;
  } catch {
    return false;
  }
}

export function isSolanaPrivateKey(value: string) {
  try {
    return bs58.decode(value).length === 64;
  } catch {
    return false;
  }
}
