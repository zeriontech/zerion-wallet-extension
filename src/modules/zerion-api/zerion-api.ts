import { securityCheckUrl } from './requests/security-check-url';
import { registerAddresses } from './requests/register-wallets';
import { getWalletsMeta } from './requests/wallets-meta';
import { getGasPrices } from './requests/get-gas-prices';
import { registerChain } from './requests/register-chain';
import {
  checkPaymasterEligibility,
  getPaymasterParams,
} from './requests/paymaster-transactions';

export const ZerionAPI = {
  getGasPrices,
  securityCheckUrl,
  registerChain,
  registerAddresses,
  getWalletsMeta,
  checkPaymasterEligibility,
  getPaymasterParams,
};
