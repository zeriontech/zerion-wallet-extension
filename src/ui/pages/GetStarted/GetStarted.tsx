import React, { useEffect, useMemo, useRef } from 'react';
import { Link, Route, Routes, useSearchParams } from 'react-router-dom';
import { Button } from 'src/ui/ui-kit/Button';
import { PageTop } from 'src/ui/components/PageTop';
import { PageColumn } from 'src/ui/components/PageColumn';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { SeedType } from 'src/shared/SeedType';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { AddressBadge } from 'src/ui/components/AddressBadge';
import { useWalletGroups } from 'src/ui/shared/requests/useWalletGroups';
import { walletPort } from 'src/ui/shared/channels';
import { PageBottom } from 'src/ui/components/PageBottom';
import { getGroupDisplayName } from 'src/ui/shared/getGroupDisplayName';
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import backgroundArts from 'src/ui/assets/background-arts.svg';
import { Background } from 'src/ui/components/Background';
import { useBodyStyle } from 'src/ui/components/Background/Background';
import { AngleRightRow } from 'src/ui/components/AngleRightRow';
import { HStack } from 'src/ui/ui-kit/HStack';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import { useQuery } from 'react-query';
import { ImportWallet } from './ImportWallet';
import { GenerateWallet } from './GenerateWallet';

function createNextHref(path: string, beforePath: string | null) {
  return beforePath ? `${beforePath}?next=${encodeURIComponent(path)}` : path;
}

function NewWalletOption({
  beforeCreate,
  mnemonicWalletGroups: mnemonicGroups,
}: {
  beforeCreate: string | null;
  mnemonicWalletGroups: WalletGroup[] | null;
}) {
  const autoFocusRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    autoFocusRef.current?.focus();
  }, []);
  const hasMnemonicWallets = mnemonicGroups ? mnemonicGroups.length > 0 : false;

  const newWalletPath = createNextHref('/get-started/new', beforeCreate);

  const elevationStyle = { boxShadow: 'var(--elevation-200)' };
  return (
    <VStack gap={8}>
      {hasMnemonicWallets ? (
        <Button
          ref={autoFocusRef}
          size={56}
          as={Link}
          to={`wallet-group-select?${
            beforeCreate ? new URLSearchParams({ beforeCreate }) : ''
          }`}
          style={elevationStyle}
        >
          Create New Wallet
        </Button>
      ) : (
        <Button
          ref={autoFocusRef}
          as={Link}
          to={newWalletPath}
          size={56}
          style={elevationStyle}
        >
          Create New Wallet
        </Button>
      )}
    </VStack>
  );
}

function DecorativeFeatureList() {
  const features = [
    'Sign transactions in-app',
    'Manage your multichain portfolio',
    'Import multiple wallets',
  ];
  return (
    <ul
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'grid',
        gridTemplateRows: 'auto',
        gap: 8,
      }}
    >
      {features.map((text, index) => (
        <li key={index}>
          <HStack gap={8} alignItems="center">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
                borderRadius: '50%',
                backgroundColor: 'var(--z-index-1)',
                color: 'var(--primary)',
              }}
            >
              <CheckIcon style={{ width: 16, height: 16 }} />
            </div>

            <UIText kind="body/regular">{text}</UIText>
          </HStack>
        </li>
      ))}
    </ul>
  );
}

function Options() {
  const { data: walletGroups, isLoading } = useWalletGroups();
  const [params] = useSearchParams();
  const mnemonicGroups = useMemo(
    () =>
      walletGroups?.filter(
        (group) => group.walletContainer.seedType === SeedType.mnemonic
      ),
    [walletGroups]
  );
  const hasMnemonicWallets = mnemonicGroups ? mnemonicGroups.length > 0 : false;

  useBodyStyle(
    useMemo(
      () => ({
        backgroundColor: 'var(--neutral-100)',
        backgroundImage: `url(${backgroundArts})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }),
      []
    )
  );

  const { data: allowCreateWallet } = useQuery(
    `wallet/getRemoteConfigValue(allow_create_wallet)`,
    () =>
      walletPort.request('getRemoteConfigValue', {
        key: 'allow_create_wallet',
      }),
    { useErrorBoundary: true, suspense: true }
  );

  if (isLoading) {
    return null;
  }

  const beforeCreate = params.get('beforeCreate');
  const isIntro = params.has('intro');
  const importHref = createNextHref('/get-started/import', beforeCreate);
  return (
    <Background backgroundKind="transparent">
      <PageColumn style={{ paddingTop: 100 }}>
        <NavigationTitle urlBar={isIntro ? 'none' : undefined} title={null} />
        <UIText kind="headline/hero">
          {hasMnemonicWallets ? null : (
            <span>
              Introducing
              <br aria-hidden={true} />
            </span>
          )}
          <span
            style={{
              color: hasMnemonicWallets ? 'currentColor' : 'var(--primary)',
            }}
          >
            Zerion Wallet
          </span>
        </UIText>
        <Spacer height={8} />
        <UIText kind="headline/h3">Explore all of Web3 in one place</UIText>

        <Spacer height={24} />

        <DecorativeFeatureList />

        <Spacer height={24} />

        <VStack gap={16}>
          {allowCreateWallet === 'true' && (
            <NewWalletOption
              beforeCreate={beforeCreate}
              mnemonicWalletGroups={mnemonicGroups || null}
            />
          )}
          <Button
            kind="regular"
            as={Link}
            to={importHref}
            size={56}
            style={{
              boxShadow: 'var(--elevation-300)',
              backgroundColor: 'var(--white)',
            }}
          >
            Import Existing Wallet
          </Button>
        </VStack>
        <PageBottom />
      </PageColumn>
    </Background>
  );
}

function WalletGroupSelect() {
  const [params] = useSearchParams();
  const beforeCreate = params.get('beforeCreate');
  const { data: walletGroups, isLoading } = useWalletGroups();
  const mnemonicGroups = useMemo(
    () =>
      walletGroups?.filter(
        (group) => group.walletContainer.seedType === SeedType.mnemonic
      ),
    [walletGroups]
  );
  if (isLoading) {
    return null;
  }
  if (!mnemonicGroups) {
    throw new Error('Wallet Groups are required to display this view');
  }
  return (
    <PageColumn>
      <NavigationTitle title="Create New Wallet" />
      <PageTop />
      <VStack gap={20}>
        <VStack gap={8}>
          <UIText kind="subtitle/m_reg" color="var(--neutral-500)">
            Add new address to an existing group
          </UIText>

          <SurfaceList
            items={mnemonicGroups.map((group) => {
              return {
                key: group.id,
                to: createNextHref(
                  `/get-started/import/mnemonic?groupId=${group.id}`,
                  beforeCreate
                ),
                component: (
                  <AngleRightRow>
                    <VStack gap={4}>
                      <UIText kind="subtitle/m_med">
                        {getGroupDisplayName(group.name)}
                      </UIText>
                      <div
                        style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}
                      >
                        {group.walletContainer.wallets.map((wallet) => (
                          <AddressBadge key={wallet.address} wallet={wallet} />
                        ))}
                      </div>
                    </VStack>
                  </AngleRightRow>
                ),
              };
            })}
          />
        </VStack>
        <VStack gap={8}>
          <UIText kind="subtitle/m_reg" color="var(--neutral-500)">
            Or create a new wallet group
          </UIText>
          <SurfaceList
            items={[
              {
                key: 0,
                to: createNextHref('/get-started/new', beforeCreate),
                component: (
                  <UIText kind="body/regular" color="var(--primary)">
                    <span
                      style={{ fontSize: '1.25em', verticalAlign: 'middle' }}
                    >
                      +
                    </span>{' '}
                    <span style={{ verticalAlign: 'middle' }}>
                      Create New Wallet Group
                    </span>
                  </UIText>
                ),
              },
            ]}
          />

          <UIText kind="subtitle/m_reg" color="var(--neutral-500)">
            This will create a new recovery phrase
          </UIText>
        </VStack>
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}

export function GetStarted() {
  return (
    <Routes>
      <Route path="/" element={<Options />} />
      <Route path="/new" element={<GenerateWallet />} />
      <Route path="/import/*" element={<ImportWallet />} />
      <Route path="/wallet-group-select" element={<WalletGroupSelect />} />
    </Routes>
  );
}
