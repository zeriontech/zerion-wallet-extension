import { ALCHEMY_KEY } from 'src/env/config';

export const keys = {
  ARBITRUM_INFURA_API_KEY: 'e2e40a30dc83445e8b4d5d7c88f85276',
  AURORA_API_KEY: '2ZaW4eTLoH9wrr3N5jMfSkyGXA9PLJDRb5jZdHV591mr',
  ETHEREUM_ALCHEMY_API_KEY: ALCHEMY_KEY as string,
  OPTIMISM_INFURA_API_KEY: 'e2e40a30dc83445e8b4d5d7c88f85276',
  POLYGON_INFURA_API_KEY: 'e2e40a30dc83445e8b4d5d7c88f85276',
  SOLANA_API_KEY: '',
};

export type Keys = typeof keys;

type Key = keyof Keys;

export function applyKeyToEndpoint(endpoint: string, keys: Keys) {
  /**
   * input: https://eth-mainnet.alchemyapi.io/v2/{ETHEREUM_ALCHEMY_API_KEY}
   * output: https://eth-mainnet.alchemyapi.io/v2/keyValue
   */
  let result = endpoint;
  for (const key in keys) {
    result = result.replace(`{${key}}`, keys[key as Key]);
  }
  return result;
}
