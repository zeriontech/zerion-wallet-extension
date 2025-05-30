import type { Options as KyOptions } from 'ky';
import { securityCheckUrl } from './requests/security-check-url';
import { registerAddresses } from './requests/register-wallets';
import {
  getWalletsMeta,
  getWalletsMetaByChunks,
} from './requests/wallet-get-meta';
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
import { assetGetFungibleFullInfo } from './requests/asset-get-fungible-full-info';
import { walletGetAssetDetails } from './requests/wallet-get-asset-details';
import { assetGetFungiblePnl } from './requests/asset-get-fungible-pnl';
import { assetGetChart } from './requests/asset-get-chart';

export interface ZerionApiContext {
  getAddressProviderHeader(address: string): Promise<string>;
  getKyOptions(): KyOptions;
}

export const ZerionApiBare = {
  getGasPrices,
  securityCheckUrl,
  registerChain,
  registerAddresses,
  getWalletsMeta,
  getWalletsMetaByChunks,
  paymasterCheckEligibility,
  getPaymasterParams,
  walletGetPositions,
  walletGetPortfolio,
  checkReferral,
  referWallet,
  claimRetro,
  assetGetFungibleFullInfo,
  assetGetFungiblePnl,
  walletGetAssetDetails,
  assetGetChart,
};

export type ZerionApiClient = ZerionApiContext & typeof ZerionApiBare;
