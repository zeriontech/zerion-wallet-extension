import React, { useEffect, useState } from 'react';
import { Content } from 'react-area';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import { createChain } from 'src/modules/networks/Chain';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { intersperce } from 'src/ui/shared/intersperce';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { useStore } from '@store-unit/react';
import { NetworkSelect } from '../../Networks/NetworkSelect';
import { getTabScrollContentHeight, offsetValues } from '../getTabsOffset';
import * as styles from './styles.module.css';

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
  const { networks } = useNetworks();
  const [showWalletNameContent, setShowWalletNameContent] = useState(false);
  const offsetValuesState = useStore(offsetValues);
  const SCROLL_THRESHOLD = getTabScrollContentHeight(offsetValuesState) - 8;

  const network = dappChain
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
  }, []);

  return (
    <>
      {hasValue && showWalletNameContent ? (
        <Content name="wallet-name-end">
          <UIText
            kind="headline/h3"
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
          gridTemplateColumns: hasValue
            ? 'minmax(130px, max-content) minmax(40px, max-content)'
            : 'minmax(50px, max-content) minmax(40px, max-content)',
          width: '100%',
        }}
      >
        <NetworkSelect
          value={chain}
          onChange={(selectedValue) =>
            onChange(selectedValue === dappChain ? null : selectedValue)
          }
          renderButton={({ value, openDialog }) => {
            const filterNetwork =
              value === NetworkSelectValue.All
                ? null
                : networks?.getNetworkByName(createChain(value));

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
                <UIText kind="headline/h3" style={{ width: '100%' }}>
                  <HStack
                    gap={4}
                    alignItems="center"
                    style={{
                      gridTemplateColumns: hasValue
                        ? 'minmax(40px, max-content) auto minmax(40px, max-content) auto'
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
                          {filterNetwork ? filterNetwork.name : 'All Networks'}
                        </div>,
                        hasValue ? (
                          <div
                            key={1}
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: 100,
                            }}
                          >
                            {totalValue}
                          </div>
                        ) : null,
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
          }}
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
            {showAllNetworksHelperButton ? 'All Networks' : network?.name}
          </Button>
        ) : null}
      </HStack>
    </>
  );
}
