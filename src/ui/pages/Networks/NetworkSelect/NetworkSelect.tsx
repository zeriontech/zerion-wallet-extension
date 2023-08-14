import React, { useMemo, useRef } from 'react';
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
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import { useAddressPortfolioDecomposition } from 'defi-sdk';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { noValueDash } from 'src/ui/shared/typography';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';

export function NetworkSelect({
  value,
  onChange,
  type,
  valueMaxWidth,
}: {
  value: string;
  onChange: (value: string) => void;
  type: 'overview' | 'connection';
  valueMaxWidth?: number;
}) {
  const { params } = useAddressParams();
  const { value: portfolioDecomposition } = useAddressPortfolioDecomposition({
    ...params,
    currency: 'usd',
  });
  const chain = value === NetworkSelectValue.All ? null : createChain(value);
  const { networks } = useNetworks();
  const network = useMemo(
    () => (chain && networks ? networks.getNetworkByName(chain) : null),
    [chain, networks]
  );
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  return (
    <>
      <BottomSheetDialog ref={dialogRef} containerStyle={{ padding: 0 }}>
        <NetworkSelectDialog
          value={value}
          type={type}
          chainDistribution={portfolioDecomposition}
        />
      </BottomSheetDialog>
      <Button
        size={32}
        kind="text-primary"
        onClick={() => {
          invariant(dialogRef.current, 'Dialog element not found');
          showConfirmDialog(dialogRef.current).then((chain) =>
            onChange(chain === 'all' ? NetworkSelectValue.All : chain)
          );
        }}
      >
        <HStack gap={8} alignItems="center">
          {!network || value === NetworkSelectValue.All || !network.icon_url ? (
            <AllNetworksIcon
              style={{ width: 24, height: 24 }}
              role="presentation"
            />
          ) : (
            <NetworkIcon
              size={24}
              src={network.icon_url}
              name={network.name}
              chainId={network.external_id}
            />
          )}
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span
              style={
                valueMaxWidth
                  ? {
                      maxWidth: valueMaxWidth,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    }
                  : undefined
              }
            >
              {value === NetworkSelectValue.All
                ? 'All Networks'
                : chain
                ? networks?.getChainName(chain)
                : noValueDash}
            </span>
            <ArrowDownIcon style={{ width: 20, height: 20 }} />
          </span>
        </HStack>
      </Button>
    </>
  );
}
