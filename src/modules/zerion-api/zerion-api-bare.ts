import { securityCheckUrl } from './requests/security-check-url';
import { registerAddresses } from './requests/register-wallets';
import { getWalletsMeta } from './requests/wallet-get-meta';
import { getGasPrices } from './requests/get-gas-prices';
import { registerChain } from './requests/register-chain';
import {
  paymasterCheckEligibility,
  getPaymasterParams,
} from './requests/paymaster-transactions';
import { walletGetPositions } from './requests/wallet-get-positions';
import { walletGetPortfolio } from './requests/wallet-get-portfolio';
import { checkReferral } from './requests/check-referral';
import { referWallet } from './requests/refer-wallet';
import { claimRetro } from './requests/claim-retro';

export interface ZerionApiContext {
  getAddressProviderHeader(address: string): Promise<string>;
}

export const ZerionApiBare = {
  getGasPrices,
  securityCheckUrl,
  registerChain,
  registerAddresses,
  getWalletsMeta,
  paymasterCheckEligibility,
  getPaymasterParams,
  walletGetPositions,
  walletGetPortfolio,
  checkReferral,
  referWallet,
  claimRetro,
};

export type ZerionApiClient = typeof ZerionApiBare;
