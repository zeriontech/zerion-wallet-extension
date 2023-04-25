import type { CSSProperties } from 'react';
import BigNumber from 'bignumber.js';
import React from 'react';
import type { AssetQuantity } from 'src/modules/networks/asset';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { middleTruncate } from 'src/ui/shared/middleTruncate';
import { muchGreater, veryMuchGreater } from 'src/ui/shared/typography';
import memoize from 'lodash/memoize';

const formatWithSignificantValue = memoize((value: BigNumber) =>
  formatTokenValue(value, '', {
    notation: value.gt(new BigNumber(1e8)) ? 'compact' : undefined,
  })
);

export function AssetQuantityValue({
  sign,
  quantity,
}: {
  sign?: string;
  quantity: AssetQuantity;
}) {
  const style: CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  if (quantity.type === 'veryLarge') {
    return (
      <span style={style}>
        <span style={{ position: 'relative', top: -1 }}>{veryMuchGreater}</span>
        1T
      </span>
    );
  } else if (quantity.type === 'large') {
    return <span style={style}>{`${muchGreater} 1T`}</span>;
  } else {
    const formatted = formatWithSignificantValue(quantity.value);
    const value =
      quantity.value.lt(new BigNumber(1)) && formatted.length > 8
        ? middleTruncate({
            value: quantity.value.toString(),
            trailingLettersCount: 5,
          })
        : formatted;

    return <span style={style}>{`${sign || ''}${value.trim()}`}</span>;
  }
}
