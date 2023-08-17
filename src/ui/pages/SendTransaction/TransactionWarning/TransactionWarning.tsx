import React from 'react';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import {
  FishingDefenceServiceFailWarning,
  useFishingDefenceServiceFail,
} from 'src/ui/components/FishingDefence/FishingDefenceFailWarning';
import type { NetworkFeeConfiguration } from '../NetworkFee/types';
import {
  InsufficientFundsWarning,
  useInsufficientFundsWarning,
} from './InsufficientFundsWarning';

export function TransactionWarning({
  address,
  transaction,
  chain,
  networkFeeConfiguration,
  origin,
}: {
  address: string;
  transaction: IncomingTransaction;
  chain: Chain;
  networkFeeConfiguration: NetworkFeeConfiguration;
  origin: string;
}) {
  const isInsufficientFundsWarning = useInsufficientFundsWarning({
    address,
    transaction,
    chain,
    networkFeeConfiguration,
  });
  const isDefenceDerviceFail = useFishingDefenceServiceFail(origin);

  const hasWarning = isInsufficientFundsWarning || isDefenceDerviceFail;

  return (
    <>
      <ZStack hideLowerElements={true}>
        {isDefenceDerviceFail ? <FishingDefenceServiceFailWarning /> : null}
        {isInsufficientFundsWarning ? (
          <InsufficientFundsWarning chain={chain} />
        ) : null}
      </ZStack>
      {hasWarning ? <Spacer height={16} /> : null}
    </>
  );
}
