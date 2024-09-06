import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api';
import { useAddressPortfolioDecomposition } from 'defi-sdk';
import {
  formatCurrencyToParts,
  formatCurrencyValue,
} from 'src/shared/units/formatCurrencyValue';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import type {
  MintsForYou as MintForYouType,
  TopMovers as TopMoversType,
  FeaturedDapps as FeaturedDappsType,
  PopularWallets as PopularWalletsType,
  TopTokens as TopTokensType,
} from 'src/modules/zerion-api/requests/explore-info';
import { UIText } from '../ui-kit/UIText';
import { useWalletAddresses } from '../pages/Networks/shared/useWalletAddresses';
import { VerifyUser } from '../components/VerifyUser';
import { HStack } from '../ui-kit/HStack';
import { Frame } from '../ui-kit/Frame';
import { VStack } from '../ui-kit/VStack';
import { NeutralDecimals } from '../ui-kit/NeutralDecimals';
import { minus, NBSP, noValueDash } from '../shared/typography';
import { walletPort } from '../shared/channels';
import { Media } from '../ui-kit/Media';
import { WalletAvatar } from '../components/WalletAvatar';
import { WalletSourceIcon } from '../components/WalletSourceIcon';
import { WalletDisplayName } from '../components/WalletDisplayName';
import { PortfolioValue } from '../shared/requests/PortfolioValue';
import { UnstyledAnchor } from '../ui-kit/UnstyledAnchor';
import { useBackgroundKind } from '../components/Background';
import { TokenIcon } from '../ui-kit/TokenIcon';
import { middleTruncate } from '../shared/middleTruncate';

function WalletItem({
  wallet,
}: {
  wallet: ExternallyOwnedAccount & { groupId: string };
}) {
  return (
    <Frame style={{ padding: '6px 8px' }}>
      <HStack gap={4} justifyContent="space-between" alignItems="center">
        <Media
          vGap={0}
          image={
            <WalletAvatar
              address={wallet.address}
              size={40}
              borderRadius={4}
              icon={
                <WalletSourceIcon
                  address={wallet.address}
                  groupId={wallet.groupId}
                  style={{ width: 16, height: 16 }}
                />
              }
            />
          }
          text={
            <UIText kind="small/regular">
              <WalletDisplayName
                wallet={wallet}
                render={(data) => (
                  <span
                    style={{
                      wordBreak: 'break-all',
                      verticalAlign: 'middle',
                    }}
                  >
                    {data.value}
                  </span>
                )}
              />
            </UIText>
          }
          detailText={
            <PortfolioValue
              address={wallet.address}
              render={(entry) => (
                <UIText kind="headline/h3">
                  {entry.value ? (
                    <NeutralDecimals
                      parts={formatCurrencyToParts(
                        entry.value?.total_value || 0,
                        'en',
                        'usd'
                      )}
                    />
                  ) : (
                    NBSP
                  )}
                </UIText>
              )}
            />
          }
        />
        <PortfolioValue
          address={wallet.address}
          render={(entry) =>
            entry.data?.['portfolio-decomposition'].change_24h.relative ? (
              <UIText
                kind="small/regular"
                color={
                  entry.data['portfolio-decomposition'].change_24h.relative >= 0
                    ? 'var(--positive-500)'
                    : 'var(--negative-500)'
                }
              >
                {entry.data['portfolio-decomposition'].change_24h.relative >= 0
                  ? '+'
                  : minus}
                {formatPercent(
                  Math.abs(
                    entry.data['portfolio-decomposition'].change_24h.relative
                  ),
                  'en'
                )}
                %
              </UIText>
            ) : (
              <div />
            )
          }
        />
      </HStack>
    </Frame>
  );
}

function FeaturedDapps({ section }: { section: FeaturedDappsType }) {
  return (
    <HStack gap={20} style={{ overflowX: 'scroll', paddingRight: 48 }}>
      {section.dapps.map((dapp) => (
        <UnstyledAnchor key={dapp.name} href={dapp.url}>
          <VStack gap={4} style={{ width: 52, overflow: 'hidden' }}>
            <img
              src={dapp.iconUrl}
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                overflow: 'hidden',
                justifySelf: 'center',
              }}
            />
            <UIText
              kind="caption/regular"
              color="var(--neutral-600)"
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textAlign: 'center',
              }}
            >
              {dapp.name}
            </UIText>
          </VStack>
        </UnstyledAnchor>
      ))}
    </HStack>
  );
}

function TokenList({ section }: { section: TopMoversType | TopTokensType }) {
  return (
    <HStack gap={20} style={{ overflowX: 'scroll', paddingRight: 48 }}>
      {section.fungibles.map((token) => (
        <UnstyledAnchor
          key={token.id}
          href={`https://app.zerion.io/tokens/${token.id}`}
        >
          <VStack
            gap={12}
            style={{
              padding: 8,
              border: '2px solid var(--neutral-200)',
              borderRadius: 20,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              width: 120,
            }}
          >
            <TokenIcon src={token.iconUrl} size={24} symbol={token.symbol} />
            <VStack gap={0}>
              <UIText
                kind="caption/accent"
                color="var(--neutral-600)"
                title={token.name}
                style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}
              >
                {token.name}
              </UIText>
              <UIText kind="small/regular">
                <NeutralDecimals
                  parts={formatCurrencyToParts(
                    token.meta.price || '0',
                    'en',
                    'usd'
                  )}
                />
              </UIText>
              <UIText
                kind="caption/accent"
                color={
                  (token.meta.relativeChange1d || 0) >= 0
                    ? 'var(--positive-500)'
                    : 'var(--negative-500)'
                }
              >
                {(token.meta.relativeChange1d || 0) >= 0 ? '+' : minus}
                {formatPercent(
                  Math.abs(token.meta.relativeChange1d || 0),
                  'en'
                )}
                %
              </UIText>
            </VStack>
          </VStack>
        </UnstyledAnchor>
      ))}
    </HStack>
  );
}

function MintsForYou({ section }: { section: MintForYouType }) {
  return (
    <HStack gap={20} style={{ overflowX: 'scroll', paddingRight: 48 }}>
      {section.mints.map((mint) => (
        <UnstyledAnchor key={mint.id} href={mint.action}>
          <VStack
            gap={8}
            style={{ width: 128, overflow: 'hidden', whiteSpace: 'nowrap' }}
          >
            <img
              src={mint.imageUrl}
              alt={mint.title}
              style={{
                width: 128,
                height: 128,
                borderRadius: 20,
                overflow: 'hidden',
              }}
            />
            <VStack gap={0}>
              <UIText
                kind="body/accent"
                style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {mint.title}
              </UIText>
              <UIText
                kind="caption/accent"
                color="var(--neutral-600)"
                style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {mint.reason.title}
              </UIText>
            </VStack>
          </VStack>
        </UnstyledAnchor>
      ))}
    </HStack>
  );
}

function PopularWallets({ section }: { section: PopularWalletsType }) {
  return (
    <HStack gap={20} style={{ overflowX: 'scroll', paddingRight: 48 }}>
      {section.wallets.map((wallet) => (
        <UnstyledAnchor
          key={wallet.address}
          href={`https://app.zerion.io/${wallet.address}${
            wallet.name !== wallet.address ? `?name=${wallet.name}` : ''
          }`}
        >
          <HStack
            gap={8}
            style={{
              padding: '8px 16px',
              border: '2px solid var(--neutral-200)',
              borderRadius: 20,
              whiteSpace: 'nowrap',
            }}
            alignItems="center"
          >
            <WalletAvatar address={wallet.address} borderRadius={8} size={32} />
            <UIText kind="small/accent">
              {wallet.name === wallet.address
                ? middleTruncate({ value: wallet.address })
                : wallet.name}
            </UIText>
          </HStack>
        </UnstyledAnchor>
      ))}
    </HStack>
  );
}

function Explore({ addresses }: { addresses: string[] }) {
  const { data: exploreData } = useQuery({
    queryKey: ['getExploreSections', addresses],
    queryFn: () =>
      addresses
        ? ZerionAPI.getExploreSections({ addresses, currency: 'usd' })
        : null,
    suspense: false,
  });

  const { data: portfolioData } = useAddressPortfolioDecomposition({
    addresses,
    currency: 'usd',
  });

  const { data: walletGroups } = useQuery({
    queryKey: ['wallet/uiGetWalletGroups'],
    queryFn: () => walletPort.request('uiGetWalletGroups'),
    useErrorBoundary: true,
  });

  const wallets = useMemo(() => {
    const result = [];
    if (!walletGroups) {
      return [];
    }
    for (const group of walletGroups) {
      for (const wallet of group.walletContainer.wallets) {
        result.push({ ...wallet, groupId: group.id });
      }
    }
    return result;
  }, [walletGroups]);

  const totalValue =
    portfolioData?.['portfolio-decomposition'].total_value || noValueDash;
  const changeValue = portfolioData?.['portfolio-decomposition'].change_24h;

  return (
    <HStack gap={0} style={{ gridTemplateColumns: '1fr 448px' }}>
      <div
        style={{
          padding: '48px 0 48px 32px',
          position: 'relative',
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 48,
            bottom: 48,
            width: 2,
            right: 0,
            backgroundColor: 'var(--neutral-200)',
          }}
        />
        <VStack gap={24}>
          {exploreData?.data.sections.map((section) => (
            <VStack gap={8} key={section.id}>
              {section.id === 'featured_dapps' ? (
                <>
                  <UIText kind="small/accent">{section.title}</UIText>
                  <FeaturedDapps section={section} />
                </>
              ) : section.id === 'top_movers' || section.id === 'top_tokens' ? (
                <>
                  <UIText kind="small/accent">{section.title}</UIText>
                  <TokenList section={section} />
                </>
              ) : section.id === 'mints_for_you' ? (
                <>
                  <UIText kind="small/accent">{section.title}</UIText>
                  <MintsForYou section={section} />
                </>
              ) : section.id === 'popular_wallets' ? (
                <>
                  <UIText kind="small/accent">{section.title}</UIText>
                  <PopularWallets section={section} />
                </>
              ) : null}
            </VStack>
          ))}
        </VStack>
      </div>
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            padding: 20,
            backgroundColor: 'var(--white)',
            borderRadius: 20,
            boxShadow: 'var(--elevation-300)',
            height: '70vh',
            width: 400,
            overflowY: 'scroll',
          }}
        >
          <VStack gap={16}>
            <Frame style={{ padding: 16 }}>
              <VStack gap={0}>
                <UIText kind="small/regular" color="var(--neutral-600)">
                  Portfolio
                </UIText>
                <UIText kind="headline/h1">
                  <NeutralDecimals
                    parts={formatCurrencyToParts(totalValue, 'en', 'usd')}
                  />
                </UIText>
                {changeValue ? (
                  <UIText
                    kind="small/regular"
                    color={
                      changeValue.relative >= 0
                        ? 'var(--positive-500)'
                        : 'var(--negative-500)'
                    }
                  >
                    {`${changeValue.relative >= 0 ? '+' : minus}${formatPercent(
                      Math.abs(changeValue.relative),
                      'en'
                    )}% (${formatCurrencyValue(
                      Math.abs(changeValue.absolute),
                      'en',
                      'usd'
                    )}) Today`}
                  </UIText>
                ) : (
                  <UIText kind="small/regular">{noValueDash}</UIText>
                )}
              </VStack>
            </Frame>
            <VStack gap={8}>
              <UIText kind="small/regular">Wallets</UIText>
              {wallets.map((wallet) => (
                <WalletItem key={wallet.address} wallet={wallet} />
              ))}
            </VStack>
          </VStack>
        </div>
      </div>
    </HStack>
  );
}

function LockedTab({ onSuccess }: { onSuccess: () => void }) {
  return (
    <HStack
      gap={4}
      style={{ minHeight: '100vh', gridTemplateColumns: '1fr 450px' }}
    >
      <div></div>
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            padding: 32,
            backgroundColor: 'var(--white)',
            borderRadius: 20,
            boxShadow: 'var(--elevation-300)',
            height: '70vh',
            width: 400,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <VerifyUser onSuccess={onSuccess} />
        </div>
      </div>
    </HStack>
  );
}

export function NewTab() {
  useBackgroundKind({ kind: 'neutral' });
  const { data: addresses, refetch } = useWalletAddresses();

  if (!addresses) {
    return <LockedTab onSuccess={refetch} />;
  }

  return <Explore addresses={addresses} />;
}
