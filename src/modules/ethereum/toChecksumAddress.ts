import { ethers } from 'ethers';

export function toChecksumAddress(address: string) {
  return ethers.utils.getAddress(address);
}
