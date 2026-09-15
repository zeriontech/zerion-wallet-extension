import React from 'react';
import CheckIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import type { Permit } from 'src/modules/zerion-api/requests/wallet-prepare-permits';
import { createChain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { getSigningStepState } from './signPermitBatch';

function StepMark({
  state,
}: {
  state: ReturnType<typeof getSigningStepState>;
}) {
  if (state === 'signed') {
    return (
      <CheckIcon
        style={{ width: 20, height: 20, color: 'var(--positive-500)' }}
      />
    );
  }
  if (state === 'signing') {
    return <CircleSpinner size="20px" color="var(--primary)" />;
  }
  return (
    <div
      style={{
        width: 8,
        height: 8,
        margin: 6,
        borderRadius: '50%',
        backgroundColor: 'var(--neutral-400)',
      }}
    />
  );
}

/**
 * The Ledger-only progress view of the Reveal Dialog: a counter and one row
 * per Permit with its chain and state. Pure display — no per-step buttons,
 * the device button below it belongs to `HardwareSignMessage`.
 */
export function SigningSteps({
  permits,
  currentIndex,
}: {
  permits: Permit[];
  /** Index on the device now; `permits.length` once everything is signed */
  currentIndex: number;
}) {
  const { networks } = useNetworks();
  const allSigned = currentIndex >= permits.length;
  return (
    <VStack gap={16}>
      <VStack gap={8}>
        <UIText kind="headline/h3">
          {allSigned
            ? 'Decrypting balances…'
            : `Sign ${currentIndex + 1} of ${permits.length} on your Ledger`}
        </UIText>
        <UIText kind="body/regular" color="var(--neutral-600)">
          {allSigned
            ? 'All permits are signed. Fetching the amounts.'
            : 'Confirm each decryption permit on the device. No transaction is sent.'}
        </UIText>
      </VStack>
      <VStack gap={0}>
        {permits.map((permit, index) => {
          const state = getSigningStepState(index, currentIndex);
          const network = networks?.getNetworkByName(createChain(permit.chain));
          return (
            <HStack
              key={`${permit.chain}-${index}`}
              gap={12}
              alignItems="center"
              justifyContent="space-between"
              style={{
                padding: '8px 0',
                opacity: state === 'pending' ? 0.5 : 1,
                transition: 'opacity 150ms ease-out',
              }}
            >
              <HStack gap={8} alignItems="center">
                <NetworkIcon
                  size={24}
                  name={network?.name || permit.chain}
                  src={network?.iconUrl}
                />
                <UIText kind="body/accent">
                  {network?.name || permit.chain}
                </UIText>
              </HStack>
              <StepMark state={state} />
            </HStack>
          );
        })}
      </VStack>
    </VStack>
  );
}
