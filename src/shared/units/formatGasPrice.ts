import { baseToCommon, commonToBase } from './convert';
import { roundTokenValue } from './formatTokenValue';

export const GWEI_DECIMALS = 9;

export const weiToGwei = (value: string | number): number =>
  baseToCommon(value, GWEI_DECIMALS).toNumber();

export const weiToGweiStr = (value: string | number): string =>
  baseToCommon(value, GWEI_DECIMALS).toFixed();

export const gweiToWei = (value: string | number): number =>
  commonToBase(value, GWEI_DECIMALS).toNumber();

export const gweiToWeiStr = (value: string | number): string =>
  commonToBase(value, GWEI_DECIMALS).toFixed();

export const formatGasPrice = (value: string | number) =>
  `${roundTokenValue(weiToGwei(value))} GWEI`;
