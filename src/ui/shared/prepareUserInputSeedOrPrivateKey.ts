import { maybeNormalizeSolanaPrivateKey } from 'src/modules/solana/shared';

export function prepareUserInputSeedOrPrivateKey(value: string) {
  const string = (value as string).trim().replace(/\s+/g, ' ');
  return maybeNormalizeSolanaPrivateKey(string);
}
