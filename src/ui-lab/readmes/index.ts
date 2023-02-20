import type { Readme } from '../types';

export const readmes: Readme[] = [
  require('src/ui/pages/Overview/Overview.readme').readme,
  require('src/ui/pages/SendTransaction/SendTransaction.readme').readme,
  require('src/ui/pages/SignMessage/SignMessage.readme').readme,
  require('src/ui/pages/RequestAccounts/RequestAccounts.readme').readme,
  require('./Crypto.readme').readme,
  require('src/ui/ui-kit/SurfaceList/SurfaceList.readme').readme,
  require('src/ui/ui-kit/Radio/Radio.readme').readme,
];
