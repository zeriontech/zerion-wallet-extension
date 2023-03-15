import React, { useRef } from 'react';
import { createChain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { invariant } from 'src/shared/invariant';
import { NetworkSelectDialog } from 'src/ui/components/NetworkSelectDialog';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import AllNetworksIcon from 'jsx:src/ui/assets/all-networks.svg';

export function NetworkSelect({
  value,
  onChange,
  type,
}: {
  value: string;
  onChange: (value: string) => void;
  type: 'overview' | 'connection';
}) {
  const chain = createChain(value);
  const { networks } = useNetworks();
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  return (
    <>
      <BottomSheetDialog ref={dialogRef} style={{ padding: 0 }}>
        <NetworkSelectDialog value={value} type={type} />
      </BottomSheetDialog>
      <Button
        size={32}
        kind="ghost"
        onClick={() => {
          invariant(dialogRef.current, 'Dialog element not found');
          showConfirmDialog(dialogRef.current).then((chain) =>
            onChange(chain === 'all' ? '' : chain)
          );
        }}
      >
        <HStack gap={8} alignItems="center">
          <AllNetworksIcon
            style={{ width: 24, height: 24 }}
            role="presentation"
          />
          <span>{value ? networks?.getChainName(chain) : 'All Networks'}</span>
        </HStack>
      </Button>
    </>
  );
}
