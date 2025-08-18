import React from 'react';
import type { ActionFee } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { AssetLink } from 'src/ui/components/AssetLink';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';

export function FeeLine({ fee }: { fee: ActionFee }) {
  return (
    <HStack
      gap={24}
      alignItems="center"
      justifyContent="space-between"
      style={{ gridTemplateColumns: 'auto 1fr' }}
    >
      <UIText kind="small/regular">Network Fee</UIText>
      <UIText kind="small/accent" style={{ justifySelf: 'end' }}>
        {fee.free ? (
          <div
            style={{
              background: 'linear-gradient(90deg, #6C6CF9 0%, #FF7583 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Free
          </div>
        ) : (
          <HStack gap={4}>
            <span>{formatTokenValue(fee.amount.quantity, '')}</span>
            {fee.fungible ? <AssetLink fungible={fee.fungible} /> : null}
            {fee.amount.value != null ? (
              <span>
                (
                {formatCurrencyValue(
                  fee.amount.value,
                  'en',
                  fee.amount.currency
                )}
                )
              </span>
            ) : null}
          </HStack>
        )}
      </UIText>
    </HStack>
  );
}
