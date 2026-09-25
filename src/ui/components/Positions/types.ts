export type {
  AppInfo,
  AppPortfolio,
  AppPortfolioGroup,
  GroupedFungiblePosition,
  PositionType,
} from 'src/modules/zerion-api/requests/wallet-get-grouped-positions';

/** The synthetic id of the Wallet Bucket — holdings outside any App */
export const DEFAULT_APP_ID = 'wallet';
export const DEFAULT_APP_NAME = 'Wallet';
/** The one Position Group name of the Wallet Bucket; never shown as a sub-heading */
export const DEFAULT_NAME = 'ASSET';
