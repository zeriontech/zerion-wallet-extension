import { createPortal } from 'react-dom';
import React, { useMemo, useRef } from 'react';
import { invariant } from 'src/shared/invariant';
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
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { Networks } from 'src/modules/networks/Networks';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { walletPort } from 'src/ui/shared/channels';
import {
  mainNetworksStore,
  testenvNetworksStore,
} from 'src/modules/networks/networks-store.client';
import { useWalletPortfolio } from 'src/modules/zerion-api/hooks/useWalletPortfolio';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import type { BlockchainType } from 'src/shared/wallet/classifiers';

async function updateNetworks() {
  return Promise.all([
    mainNetworksStore.update(),
    testenvNetworksStore.update(),
  ]);
}

export function NetworkSelect({
  value,
  standard = 'evm',
  onChange,
  renderButton,
  dialogRootNode,
  filterPredicate,
  showAllNetworksOption,
  showEcosystemHint,
}: {
  value: string;
  standard?: BlockchainType | 'all';
  onChange: (value: string) => void;
  renderButton?(params: {
    value: string;
    openDialog(): void;
    networks: Networks | null;
    networksAreLoading: boolean;
  }): React.ReactNode;
  dialogRootNode?: HTMLElement;
  filterPredicate?: (network: NetworkConfig) => boolean;
  showAllNetworksOption?: boolean;
  showEcosystemHint: boolean;
}) {
  const { params } = useAddressParams();
  const { currency } = useCurrency();
  const { data } = useWalletPortfolio(
    { addresses: [params.address], currency },
    { source: useHttpClientSource() },
    { enabled: Boolean(isEthereumAddress(params.address)) }
  );
  const walletPortfolio = data?.data;
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  function handleDialogOpen() {
    invariant(dialogRef.current, 'Dialog element not found');
    showConfirmDialog(dialogRef.current).then(async (chain) => {
      if (chain !== 'all') {
        // TODO: should we combine these calls?
        await walletPort.request('uiChainSelected', { chain });
        await walletPort.request('addVisitedEthereumChain', { chain });
        await updateNetworks();
      }
      onChange(chain === 'all' ? NetworkSelectValue.All : chain);
    });
  }

  const chain = value === NetworkSelectValue.All ? null : createChain(value);
  const { networks, isLoading } = useNetworks(
    chain ? [chain.toString()] : undefined
  );
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
          filterPredicate={filterPredicate}
          value={value}
          standard={standard}
          chainDistribution={walletPortfolio ?? null}
          showAllNetworksOption={showAllNetworksOption}
          showEcosystemHint={showEcosystemHint}
        />
      )}
    />
  );
  return (
    <>
      {dialogRootNode ? createPortal(dialog, dialogRootNode) : dialog}

      {renderButton ? (
        renderButton({
          value,
          openDialog: handleDialogOpen,
          networks,
          networksAreLoading: isLoading,
        })
      ) : isLoading ? (
        <Spacer height={24} />
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
