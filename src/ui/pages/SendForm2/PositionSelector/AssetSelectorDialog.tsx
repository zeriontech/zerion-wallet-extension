import React, { useState } from 'react';
import type { Networks } from 'src/modules/networks/Networks';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { HStack } from 'src/ui/ui-kit/HStack';
import { isMacOS } from 'src/ui/shared/isMacos';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import {
  SegmentedControlGroup,
  SegmentedControlRadio,
} from 'src/ui/ui-kit/SegmentedControl';
import { TokensPanel } from './TokensPanel';
import { NftsPanel } from './NftsPanel';
import * as styles from './AssetSelectorDialog.module.css';

export type AssetSelectorMode = 'tokens' | 'nfts';

interface AssetSelectorDialogProps {
  open: boolean;
  onClose: () => void;
  defaultMode: AssetSelectorMode;
  address: string;
  positions: FungiblePosition[];
  networks: Networks;
  /** chainId -> fiat value; provided by parent so the chip strip can render
   * before NftsPanel mounts. Empty object while portfolio is loading. */
  nftChainsDistribution: Record<string, number>;
  /** True while the portfolio request is in-flight; drives chip-strip skeleton. */
  isPortfolioLoading: boolean;
  /** Currently-selected NFT id (ZPI scheme), for the grid's selection ring. */
  selectedNftId: string | null;
  defaultTokensNetwork: string | null;
  defaultNftsNetwork: string | null;
  onTokensNetworkChange: (chainId: string | null) => void;
  onNftsNetworkChange: (chainId: string | null) => void;
  onSelectFungible: (chainId: string, fungibleId: string) => void;
  onSelectNft: (nftId: string, chainId: string) => void;
}

function ModeLabel({ label, shortcut }: { label: string; shortcut: string }) {
  return (
    <HStack gap={6} alignItems="center" justifyContent="center">
      <span>{label}</span>
      <span className={styles.shortcutBadge}>{shortcut}</span>
    </HStack>
  );
}

export function AssetSelectorDialog({
  open,
  onClose,
  defaultMode,
  address,
  positions,
  networks,
  nftChainsDistribution,
  isPortfolioLoading,
  selectedNftId,
  defaultTokensNetwork,
  defaultNftsNetwork,
  onTokensNetworkChange,
  onNftsNetworkChange,
  onSelectFungible,
  onSelectNft,
}: AssetSelectorDialogProps) {
  // Children of Dialog2 unmount on close, so seeding from `defaultMode` here
  // means every open re-derives mode from the current form state. No effect needed.
  const [mode, setMode] = useState<AssetSelectorMode>(defaultMode);

  const tokenShortcut = isMacOS() ? '⇧↑' : 'Shift+↑';
  const nftShortcut = isMacOS() ? '⇧↓' : 'Shift+↓';

  return (
    <Dialog2
      open={open}
      onClose={onClose}
      title="Select Asset"
      autoFocusInput={false}
    >
      {open ? (
        <>
          <KeyboardShortcut
            combination="shift+up"
            availableDuringInputs={true}
            onKeyDown={() => setMode('tokens')}
          />
          <KeyboardShortcut
            combination="shift+down"
            availableDuringInputs={true}
            onKeyDown={() => setMode('nfts')}
          />
        </>
      ) : null}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
        }}
      >
        <div style={{ padding: '8px 16px 24px', flexShrink: 0 }}>
          <SegmentedControlGroup kind="primary">
            <SegmentedControlRadio
              name="asset-mode"
              value="tokens"
              checked={mode === 'tokens'}
              onChange={() => setMode('tokens')}
            >
              <ModeLabel label="Tokens" shortcut={tokenShortcut} />
            </SegmentedControlRadio>
            <SegmentedControlRadio
              name="asset-mode"
              value="nfts"
              checked={mode === 'nfts'}
              onChange={() => setMode('nfts')}
            >
              <ModeLabel label="NFTs" shortcut={nftShortcut} />
            </SegmentedControlRadio>
          </SegmentedControlGroup>
        </div>
        {mode === 'tokens' ? (
          <TokensPanel
            key="tokens"
            open={open}
            address={address}
            positions={positions}
            networks={networks}
            defaultSelectedNetwork={defaultTokensNetwork}
            onSelectedNetworkChange={onTokensNetworkChange}
            onSelect={(position) => {
              onSelectFungible(position.chain.id, position.fungible.id);
              onClose();
            }}
          />
        ) : (
          <NftsPanel
            key="nfts"
            open={open}
            address={address}
            networks={networks}
            nftChainsDistribution={nftChainsDistribution}
            isPortfolioLoading={isPortfolioLoading}
            selectedNftId={selectedNftId}
            defaultSelectedNetwork={defaultNftsNetwork}
            onSelectedNetworkChange={onNftsNetworkChange}
            onSelect={(position) => {
              onSelectNft(position.nft.id, position.chain.id);
              onClose();
            }}
          />
        )}
      </div>
    </Dialog2>
  );
}
