import BigNumber from 'bignumber.js';
import React from 'react';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { muchGreater, veryMuchGreater } from 'src/ui/shared/typography';
import memoize from 'lodash/memoize';

enum QuantityLevel {
  veryLarge,
  large,
  normal,
}

function getQuantityLevel(commonQuantity: BigNumber) {
  if (commonQuantity.gt(new BigNumber(1e21))) {
    return QuantityLevel.veryLarge;
  } else if (commonQuantity.gt(new BigNumber(1e15))) {
    return QuantityLevel.large;
  }

  return QuantityLevel.normal;
}

const formatWithSignificantValue = memoize((value: BigNumber) =>
  formatTokenValue(value, '', {
    notation: value.gt(new BigNumber(1e8)) ? 'compact' : undefined,
  })
);

function WordBreak({
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span style={{ wordBreak: 'break-all' }} {...props}>
      {children}
    </span>
  );
}

export function AssetQuantity({
  sign,
  commonQuantity,
}: {
  sign?: string;
  commonQuantity: BigNumber;
}) {
  const level = getQuantityLevel(commonQuantity);

  return (
    <WordBreak>
      {level === QuantityLevel.veryLarge ? (
        <>
          <span style={{ position: 'relative', top: -1 }}>
            {veryMuchGreater}
          </span>
          1T
        </>
      ) : null}
      {level === QuantityLevel.large ? `${muchGreater} 1T` : null}
      {level === QuantityLevel.normal
        ? `${sign || ''}${formatWithSignificantValue(commonQuantity)}`
        : null}
    </WordBreak>
  );
}
