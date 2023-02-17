import { ethers } from 'ethers';

export function toUtf8String(value: ethers.utils.BytesLike) {
  try {
    return ethers.utils.toUtf8String(value);
  } catch (e) {
    if (typeof value === 'string') {
      return value;
    } else {
      throw e;
    }
  }
}
