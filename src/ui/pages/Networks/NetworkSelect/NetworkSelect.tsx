import { createPortal } from 'react-dom';
import React, { useMemo, useRef } from 'react';
import { useAddressPortfolioDecomposition } from 'defi-sdk';
import { invariant } from 'src/shared/invariant';
import type { NetworkGroups } from 'src/ui/components/NetworkSelectDialog';
import { NetworkSelectDialog } from 'src/ui/components/NetworkSelectDialog';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import AllNetworksIcon from 'jsx:src/ui/assets/all-networks.svg';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { noValueDash } from 'src/ui/shared/typography';
import { createChain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';

export function NetworkSelect({
  value,
  onChange,
  renderButton,
  dialogRootNode,
  groups,
}: {
  value: string;
  onChange: (value: string) => void;
  renderButton?(params: { value: string; openDialog(): void }): React.ReactNode;
  dialogRootNode?: HTMLElement;
  groups?: NetworkGroups;
}) {
  const { params } = useAddressParams();
  const { value: portfolioDecomposition } = useAddressPortfolioDecomposition({
    ...params,
    currency: 'usd',
  });
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  function handleDialogOpen() {
    invariant(dialogRef.current, 'Dialog element not found');
    showConfirmDialog(dialogRef.current).then((chain) =>
      onChange(chain === 'all' ? NetworkSelectValue.All : chain)
    );
  }

  const chain = value === NetworkSelectValue.All ? null : createChain(value);
  const { networks } = useNetworks();
  const network = useMemo(
    () => (chain && networks ? networks.getNetworkByName(chain) : null),
    [chain, networks]
  );

  const dialog = (
    <BottomSheetDialog
      ref={dialogRef}
      height="90vh"
      containerStyle={{ padding: 0 }}
      renderWhenOpen={() => (
        <NetworkSelectDialog
          groups={groups}
          value={value}
          chainDistribution={portfolioDecomposition}
        />
      )}
    />
  );
  return (
    <>
      {dialogRootNode ? createPortal(dialog, dialogRootNode) : dialog}

      {renderButton ? (
        renderButton({ value, openDialog: handleDialogOpen })
      ) : (
        <Button
          type="button"
          size={32}
          kind="text-primary"
          onClick={handleDialogOpen}
        >
          <HStack gap={8} alignItems="center">
            {!network ||
            value === NetworkSelectValue.All ||
            !network.icon_url ? (
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
              <span>
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
      )}
    </>
  );
}
