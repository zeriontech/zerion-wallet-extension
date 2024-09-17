import { securityCheckUrl } from './requests/security-check-url';
import { registerAddresses } from './requests/register-wallets';
import { getWalletsMeta } from './requests/wallet-get-meta';
import { getGasPrices } from './requests/get-gas-prices';
import { registerChain } from './requests/register-chain';
import {
  checkPaymasterEligibility,
  getPaymasterParams,
} from './requests/paymaster-transactions';
import { walletGetPositions } from './requests/wallet-get-positions';
import { walletGetPortfolio } from './requests/wallet-get-portfolio';

export const ZerionAPI = {
  getGasPrices,
  securityCheckUrl,
  registerChain,
  registerAddresses,
  getWalletsMeta,
  checkPaymasterEligibility,
  getPaymasterParams,
  walletGetPositions,
  walletGetPortfolio,
};
