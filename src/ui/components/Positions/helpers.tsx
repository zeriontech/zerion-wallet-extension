/**
 * Taken and adapted from pulse-frontend/Root/App/Main/tabs/Overview/Positions/helpers.ts
 */
import type { AddressPosition, PositionType } from 'defi-sdk';
import { baseToCommon } from 'src/shared/units/convert';
import { getDecimals } from 'src/modules/networks/asset';
import { createChain } from 'src/modules/networks/Chain';

export const getProtocolIconURL = (protocol: string) =>
  `https://protocol-icons.s3.amazonaws.com/${protocol.replace(/\s/g, '+')}.png`;

export type ProtocolFrameColumns = 'price' | 'apy' | 'balance' | 'value' | '';

export const positionTypeToStringMap: Record<PositionType, string> = {
  asset: '',
  deposit: 'Deposited',
  loan: 'Debt',
  reward: 'Reward',
  staked: 'Staking',
  locked: 'Locked',
};

export function getPositionValue(position: AddressPosition) {
  return Number(position.value) || 0;
}

export function getPositionBalance(
  position: Pick<AddressPosition, 'asset' | 'quantity' | 'chain'>
) {
  return baseToCommon(
    position.quantity || 0,
    0 -
      getDecimals({
        asset: position.asset,
        chain: createChain(position.chain),
      })
  );
}

// we need to sum up all values, except loan values
export function getFullPositionsValue(positions?: AddressPosition[] | null) {
  return positions
    ? positions.reduce(
        (acc, item) =>
          item.type === 'loan'
            ? acc - getPositionValue(item)
            : acc + getPositionValue(item),
        0
      )
    : 0;
}
