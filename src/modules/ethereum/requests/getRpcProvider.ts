import { ethers } from 'ethers';
import memoize from 'lodash/memoize';

export const getRpcProvider = memoize((rpcUrl: string) => {
  return new ethers.providers.JsonRpcProvider(rpcUrl);
});
