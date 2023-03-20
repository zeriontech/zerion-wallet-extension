import React from 'react';
import { EmptyView } from 'src/ui/components/EmptyView/EmptyView';
import { NetworkResetButton } from 'src/ui/components/NetworkResetButton';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function EmptyViewForNetwork({
  message,
  chainValue,
  onChainChange,
}: {
  message: React.ReactNode;
  chainValue: string;
  onChainChange: (value: string) => void;
}) {
  return (
    <EmptyView
      text={
        <VStack gap={4}>
          <div>{message}</div>
          {chainValue !== NetworkSelectValue.All ? (
            <UIText kind="small/regular" color="var(--primary)">
              <NetworkResetButton
                onClick={() => onChainChange(NetworkSelectValue.All)}
              />
            </UIText>
          ) : null}
        </VStack>
      }
    />
  );
}
