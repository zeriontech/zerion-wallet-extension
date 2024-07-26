import React, { useEffect, useMemo, useState } from 'react';
import { Content } from 'react-area';
import { useStore } from '@store-unit/react';
import { isTruthy } from 'is-truthy-ts';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import { createChain } from 'src/modules/networks/Chain';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import {
  useMainnetNetwork,
  useNetworks,
} from 'src/modules/networks/useNetworks';
import { intersperce } from 'src/ui/shared/intersperce';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import type { Kind as UITextKind } from 'src/ui/ui-kit/UIText';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { isCustomNetworkId } from 'src/modules/ethereum/chains/helpers';
import { usePreferences } from 'src/ui/features/preferences';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { NBSP } from 'src/ui/shared/typography';
import { NetworkSelect } from '../../Networks/NetworkSelect';
import { getTabScrollContentHeight, offsetValues } from '../getTabsOffset';
import * as styles from './styles.module.css';

const allNetworksString = 'All Networks';

function DisclosureButton({
  value,
  openDialog,
  textKind,
  valueDetail,
}: {
  value: string;
  openDialog: () => void;
  textKind: UITextKind;
  valueDetail: React.ReactNode | null;
}) {
  const { networks, isLoading } = useNetworks();
  const { preferences } = usePreferences();
  const selectedNetwork =
    value === NetworkSelectValue.All
      ? null
      : networks?.getNetworkByName(createChain(value));

  const { data: mainnetNetwork } = useMainnetNetwork({
    chain: value,
    enabled:
      preferences?.testnetMode?.on &&
      !isLoading &&
      !selectedNetwork &&
      value !== NetworkSelectValue.All,
  });

  const network = selectedNetwork || mainnetNetwork;

  const selectedNetworkName =
    value === NetworkSelectValue.All
      ? allNetworksString
      : network?.name || value;

  return (
    <UnstyledButton
      onClick={openDialog}
      className="parent-hover"
      style={{
        width: '100%',
        ['--parent-content-color' as string]: 'var(--neutral-500)',
        ['--parent-hovered-content-color' as string]: 'var(--black)',
      }}
    >
      <UIText kind={textKind} style={{ width: '100%' }}>
        <HStack
          gap={4}
          alignItems="center"
          justifyContent="start"
          style={{
            gridTemplateColumns:
              valueDetail != null
                ? 'minmax(40px, max-content) auto auto auto'
                : 'minmax(40px, max-content) auto',
            whiteSpace: 'nowrap',
          }}
        >
          {intersperce(
            [
              <div
                key={0}
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {selectedNetworkName}
              </div>,
              valueDetail != null ? <div key={1}>{valueDetail}</div> : null,
            ],
            (key) => (
              <div key={key}>·</div>
            )
          )}
          <ArrowDownIcon
            className="content-hover"
            style={{ width: 24, height: 24 }}
          />
        </HStack>
      </UIText>
    </UnstyledButton>
  );
}

export function NetworkBalance({
  value: totalValue,
  filterChain,
  dappChain,
  onChange,
}: {
  value: React.ReactNode | null;
  filterChain: string | null;
  dappChain: string | null;
  onChange(value: string | null): void;
}) {
  const { networks, isLoading } = useNetworks([dappChain].filter(isTruthy));
  const [showWalletNameContent, setShowWalletNameContent] = useState(false);
  const { preferences } = usePreferences();
  const offsetValuesState = useStore(offsetValues);

  const SCROLL_THRESHOLD = getTabScrollContentHeight(offsetValuesState) - 8;

  const dappNetwork = dappChain
    ? networks?.getNetworkByName(createChain(dappChain))
    : null;

  const chain = filterChain || dappChain || NetworkSelectValue.All;

  const isClearableFilter = Boolean(filterChain);
  const showHelperButton = Boolean(filterChain || dappChain);
  const showAllNetworksHelperButton =
    (!dappChain && filterChain !== NetworkSelectValue.All) ||
    (dappChain && (!filterChain || filterChain === dappChain));

  const hasValue = totalValue != null;

  useEffect(() => {
    const handleScroll = () =>
      setShowWalletNameContent(window.scrollY > SCROLL_THRESHOLD);

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [SCROLL_THRESHOLD]);

  const testnetMode = preferences?.testnetMode?.on;
  const networksPredicate = useMemo(() => {
    return testnetMode
      ? (network: NetworkConfig) =>
          network.is_testnet || isCustomNetworkId(network.id)
      : undefined;
  }, [testnetMode]);

  const textKind = 'headline/h3';

  if (isLoading) {
    return (
      <UIText kind={textKind} style={{ width: '100%' }}>
        {NBSP}
      </UIText>
    );
  }

  return (
    <>
      {hasValue && showWalletNameContent ? (
        <Content name="wallet-name-end">
          <UIText
            kind={textKind}
            style={{
              paddingLeft: 8,
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            className={styles.walletNameContent}
          >
            {totalValue}
          </UIText>
        </Content>
      ) : null}
      <HStack
        gap={4}
        alignItems="center"
        style={{
          gridTemplateColumns: showHelperButton
            ? hasValue
              ? 'minmax(130px, max-content) minmax(40px, max-content)'
              : 'minmax(50px, max-content) minmax(40px, max-content)'
            : '1fr',
          width: '100%',
        }}
      >
        <NetworkSelect
          filterPredicate={networksPredicate}
          showAllNetworksOption={true}
          value={chain}
          onChange={(selectedValue) =>
            onChange(selectedValue === dappChain ? null : selectedValue)
          }
          renderButton={({ value, openDialog }) => (
            <DisclosureButton
              value={value}
              openDialog={openDialog}
              valueDetail={totalValue}
              textKind={textKind}
            />
          )}
        />

        {showHelperButton ? (
          <Button
            kind="text-primary"
            onClick={() =>
              onChange(isClearableFilter ? null : NetworkSelectValue.All)
            }
            style={{
              ['--button-text' as string]: 'var(--primary)',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {showAllNetworksHelperButton
              ? allNetworksString
              : dappNetwork?.name}
          </Button>
        ) : null}
      </HStack>
    </>
  );
}
