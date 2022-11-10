import type { Readme } from '../types';

export const readmes: Readme[] = [
  require('./Crypto.readme').readme,
  require('src/ui/pages/Overview/Overview.readme').readme,
  require('src/ui/pages/SendTransaction/SendTransaction.readme').readme,
  require('src/ui/pages/SignMessage/SignMessage.readme').readme,
  require('src/ui/pages/RequestAccounts/RequestAccounts.readme').readme,
];
