import React, { useMemo } from 'react';
import { capitalize } from 'capitalize-ts';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Surface } from 'src/ui/ui-kit/Surface';
import type { Action } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { RateLine } from '../../ActionInfo/RateLine';
import { SenderReceiverLine } from '../../ActionInfo/LabelLine';
import { FeeLine } from '../../ActionInfo/FeeLine';
import { ExplorerInfo } from '../../ActionInfo/ExplorerInfo';
import { ApprovalInfo, TransferInfo } from './components/AssetView';

const dateFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function ActView({
  act,
  showTransactionInfo,
  showTradeLabels,
}: {
  act: Action['acts'][number];
  showTransactionInfo: boolean;
  showTradeLabels: boolean;
}) {
  return null;
}

export function ActionDetailedView({ action }: { action: Action }) {
  const actionDate = useMemo(() => {
    return dateFormatter.format(new Date(action.timestamp));
  }, [action.timestamp]);

  const isFailed = action.status === 'failed' || action.status === 'dropped';

  return (
    <VStack
      gap={14}
      style={{ ['--surface-background-color' as string]: 'var(--white)' }}
    >
      <VStack gap={0} style={{ justifyItems: 'center' }}>
        <UIText
          kind="body/accent"
          color={isFailed ? 'var(--negative-500)' : undefined}
        >
          {`${action.type.displayValue}${
            isFailed ? ` (${capitalize(action.status)})` : ''
          }`}
        </UIText>
        <UIText kind="small/regular" color="var(--neutral-500)">
          {actionDate}
        </UIText>
      </VStack>
      <VStack gap={16}>
        <VStack gap={8}>
          {action.acts.map((act, index) => (
            <ActView
              key={index}
              act={act}
              showTransactionInfo={!action.transaction}
              showTradeLabels={action.acts.length === 1}
            />
          ))}
        </VStack>
        <Surface padding={16}>
          <VStack gap={24}>
            {action.transaction ? (
              <ExplorerInfo transaction={action.transaction} />
            ) : null}
            <VStack gap={20}>
              {action.acts.length === 1 && action.acts[0].rate ? (
                <RateLine rate={action.acts[0].rate} />
              ) : null}
              {action.label ? (
                <SenderReceiverLine label={action.label} />
              ) : null}
              {action.fee ? <FeeLine fee={action.fee} /> : null}
            </VStack>
          </VStack>
        </Surface>
      </VStack>
    </VStack>
  );
}
