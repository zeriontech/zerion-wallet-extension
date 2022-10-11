import { ethers } from 'ethers';

ethers.utils.defaultPath;
const next = (index: number) => `m/44'/60'/0'/0/${index}`;

export const getAccountPath = next;

export function getIndexFromPath(path: string) {
  const digits = path.match(/m\/44'\/60'\/0'\/0\/(\d+)/)?.[1];
  return digits ? Number(digits) : 0;
}

export function getNextAccountPath(path: string) {
  const match = path.match(/m\/44'\/60'\/0'\/0\/(\d+)/);
  if (match) {
    return next(Number(match[1]) + 1);
  } else {
    return ethers.utils.defaultPath;
  }
}
