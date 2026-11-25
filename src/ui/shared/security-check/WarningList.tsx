import React from 'react';
import type { Warning } from 'src/modules/zerion-api/requests/wallet-simulate-transaction';
import { TransactionWarning } from 'src/ui/pages/SendTransaction/TransactionWarnings/TransactionWarning';
import { VStack } from 'src/ui/ui-kit/VStack';
import { getWarningKey, getWarningKind } from './warningPresentation';

export function WarningList({ warnings }: { warnings: Warning[] }) {
  return (
    <VStack gap={8}>
      {warnings.map((warning, index) => (
        <TransactionWarning
          key={getWarningKey(warning, index)}
          title={warning.title}
          message={
            <div
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 5,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
              }}
              title={warning.description}
            >
              {warning.description}
            </div>
          }
          kind={getWarningKind(warning.severity)}
        />
      ))}
    </VStack>
  );
}
