import { ethers } from 'ethers';
import { memoize } from 'moderndash';

export const getRpcProvider = memoize((rpcUrl: string) => {
  return new ethers.JsonRpcProvider(rpcUrl);
});
