import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isTruthy } from 'is-truthy-ts';
import dayjs from 'dayjs';
import { useBackgroundKind } from 'src/ui/components/Background';
import { whiteBackgroundKind } from 'src/ui/components/Background/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import ArrowDownIcon from 'jsx:src/ui/assets/caret-down-filled.svg';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { HStack } from 'src/ui/ui-kit/HStack';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { UIText } from 'src/ui/ui-kit/UIText';
import { walletPort } from 'src/ui/shared/channels';
import { PageTop } from 'src/ui/components/PageTop';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import ZerionIcon from 'jsx:src/ui/assets/zerion-premium-logo.svg';
import { PageBottom } from 'src/ui/components/PageBottom';
import { useFirebaseConfig } from 'src/modules/remote-config/plugins/useFirebaseConfig';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { useWalletsMetaByChunks } from 'src/ui/shared/requests/useWalletsMetaByChunks';

type PremiumStatusKind = 'active' | 'expiring' | 'expired';

export function PremiumPage() {
  useBackgroundKind(whiteBackgroundKind);

  const { data: wallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => {
      return walletPort.request('uiGetCurrentWallet');
    },
  });

  const { data: config, isLoading: isConfigLoading } = useFirebaseConfig([
    'premium_page_feedback_link',
  ]);

  const { data: walletsMeta, isLoading } = useWalletsMetaByChunks({
    addresses: [wallet?.address].filter(isTruthy),
    enabled: Boolean(wallet?.address),
    suspense: false,
  });

  const premiumInfo = walletsMeta?.at(0)?.membership.premium;
  const expireDate = premiumInfo?.expirationTime;

  const isMoreThan7Days = useMemo(
    () =>
      expireDate ? dayjs(expireDate).isAfter(dayjs().add(7, 'day')) : false,
    [expireDate]
  );

  const isUnlimited = premiumInfo && !expireDate;

  const kind: PremiumStatusKind = isUnlimited
    ? 'active'
    : expireDate
    ? isMoreThan7Days
      ? 'active'
      : 'expiring'
    : 'expired';

  const formattedDate = expireDate
    ? dayjs(expireDate).format('MMMM D, YYYY')
    : '';

  const formattedDateInfo = isUnlimited
    ? 'Lifetime'
    : expireDate
    ? kind === 'active'
      ? `Until ${formattedDate}`
      : kind === 'expiring'
      ? `${dayjs(expireDate).fromNow(true)} left`
      : ''
    : '';

  return (
    <PageColumn style={{ paddingTop: 40 }}>
      <NavigationTitle
        title={
          <UnstyledLink
            to="/wallet-select"
            title="Change Wallet"
            className="parent-hover"
            style={{
              ['--parent-content-color' as string]: 'var(--neutral-500)',
              ['--parent-hovered-content-color' as string]: 'var(--black)',
            }}
          >
            {wallet ? (
              <HStack gap={4} alignItems="center" justifyContent="center">
                <WalletDisplayName
                  wallet={wallet}
                  maxCharacters={16}
                  render={(name) => (
                    <UIText kind="body/accent">{name.value}</UIText>
                  )}
                />
                <ArrowDownIcon
                  className="content-hover"
                  style={{ width: 24, height: 24 }}
                />
              </HStack>
            ) : null}
          </UnstyledLink>
        }
        documentTitle="Premium Info"
      />
      <PageTop />
      {wallet && !isLoading ? (
        <VStack gap={24} style={{ paddingTop: 32, justifyItems: 'center' }}>
          <WalletAvatar
            address={wallet.address}
            size={180}
            borderRadius={24}
            borderWidth={6}
          />
          <VStack gap={8} style={{ justifyItems: 'center' }}>
            <HStack gap={8} alignItems="center" justifyContent="center">
              <UIText
                kind="headline/h2"
                style={{
                  background:
                    'linear-gradient(90deg, #6C6CF9 0%, #FF7583 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Premium
              </UIText>
              {kind === 'active' ? (
                <UIText
                  kind="small/accent"
                  color="var(--always-white)"
                  style={{
                    padding: '4px 12px',
                    borderRadius: 16,
                    backgroundColor: 'var(--positive-500)',
                  }}
                >
                  Active
                </UIText>
              ) : kind === 'expiring' ? (
                <UIText
                  kind="small/accent"
                  color="var(--always-white)"
                  style={{
                    padding: '4px 12px',
                    borderRadius: 16,
                    backgroundColor: 'var(--notice-500)',
                  }}
                >
                  Expiring
                </UIText>
              ) : (
                <UIText
                  kind="small/accent"
                  color="var(--always-white)"
                  style={{
                    padding: '4px 12px',
                    borderRadius: 16,
                    backgroundColor: 'var(--negative-500)',
                  }}
                >
                  Expired
                </UIText>
              )}
            </HStack>
            <UIText
              kind="small/regular"
              color="var(--neutral-700)"
              title={formattedDate}
              style={{ height: 20 }}
            >
              {formattedDateInfo}
            </UIText>
          </VStack>
          {isConfigLoading || !config?.premium_page_feedback_link ? null : (
            <Button
              as={UnstyledAnchor}
              size={36}
              href={config.premium_page_feedback_link}
              target="_blank"
              rel="noopener noreferrer"
              kind="regular"
              style={{ paddingInline: 12 }}
            >
              Leave Feedback
            </Button>
          )}
        </VStack>
      ) : null}
      <VStack gap={8} style={{ marginTop: 'auto' }}>
        <Button kind="primary" size={48}>
          <HStack gap={8} alignItems="center" justifyContent="center">
            <ZerionIcon style={{ width: 20, height: 20 }} />
            <UIText kind="body/accent">Renew Premium</UIText>
          </HStack>
        </Button>
        <Button
          as={UnstyledAnchor}
          size={48}
          href="http://zerion.io/premium"
          target="_blank"
          rel="noopener noreferrer"
          kind="regular"
        >
          <UIText kind="body/accent">Premium Features</UIText>
        </Button>
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}
