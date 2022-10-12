import React, { useEffect, useMemo, useRef } from 'react';
import {
  Link,
  Route,
  Routes,
  useLocation,
  useSearchParams,
} from 'react-router-dom';
import { Button } from 'src/ui/ui-kit/Button';
import { PageHeading } from 'src/ui/components/PageHeading';
import { PageTop } from 'src/ui/components/PageTop';
import { PageColumn } from 'src/ui/components/PageColumn';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Surface } from 'src/ui/ui-kit/Surface';
import { SeedType } from 'src/shared/SeedType';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { AddressBadge } from 'src/ui/components/AddressBadge';
import { useWalletGroups } from 'src/ui/shared/requests/useWalletGroups';
import { PageBottom } from 'src/ui/components/PageBottom';
import { getGroupDisplayName } from 'src/ui/shared/getGroupDisplayName';
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import { GenerateWallet } from './GenerateWallet';
import { ImportWallet } from './ImportWallet';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { TitleWithLine } from './components/TitleWithLine';

function createNextHref(path: string, beforePath: string | null) {
  return beforePath ? `${beforePath}?next=${encodeURIComponent(path)}` : path;
}

function NewWalletOption({
  beforeCreate,
  walletGroups,
}: {
  beforeCreate: string | null;
  walletGroups: WalletGroup[] | null;
}) {
  const location = useLocation();
  const [params] = useSearchParams();
  const autoFocusRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    autoFocusRef.current?.focus();
  }, []);
  const mnemonicGroups = useMemo(
    () =>
      walletGroups?.filter(
        (group) => group.walletContainer.seedType === SeedType.mnemonic
      ),
    [walletGroups]
  );
  const hasMnemonicWallets = mnemonicGroups ? mnemonicGroups.length > 0 : false;
  const selectedGroupId = mnemonicGroups?.length
    ? params.get('groupId') || mnemonicGroups[0].id
    : null;
  const selectedGroup = useMemo(
    () =>
      selectedGroupId && mnemonicGroups
        ? mnemonicGroups.find((group) => group.id === selectedGroupId)
        : null,
    [mnemonicGroups, selectedGroupId]
  );

  const newWalletPath = createNextHref('/get-started/new', beforeCreate);

  return (
    <VStack gap={8}>
      {hasMnemonicWallets && selectedGroupId ? (
        <Button
          ref={autoFocusRef}
          size={44}
          as={Link}
          to={createNextHref(
            `/get-started/import/mnemonic?groupId=${selectedGroupId}`,
            beforeCreate
          )}
        >
          Create New Wallet
        </Button>
      ) : (
        <Button ref={autoFocusRef} as={Link} to={newWalletPath} size={56}>
          Create New Wallet
        </Button>
      )}
      {hasMnemonicWallets ? (
        <UIText kind="subtitle/l_reg">
          Within{' '}
          <Link
            style={{ color: 'var(--primary)' }}
            to={`wallet-group-select?${new URLSearchParams({
              next: location.pathname + location.search,
            })}`}
          >
            {getGroupDisplayName(selectedGroup?.name || '')}
          </Link>
        </UIText>
      ) : null}
      {hasMnemonicWallets ? (
        <>
          <UIText kind="subtitle/l_reg" color="var(--neutral-500)">
            <TitleWithLine lineColor="var(--neutral-300)">or</TitleWithLine>
          </UIText>
          <Button kind="regular" as={Link} to={newWalletPath} size={56}>
            Create New Wallet Group
          </Button>
          <UIText kind="subtitle/m_reg" color="var(--neutral-500)">
            This will create a new recovery phrase
          </UIText>
        </>
      ) : null}
    </VStack>
  );
}

function Options() {
  const { data: walletGroups, isLoading } = useWalletGroups();
  const [params] = useSearchParams();
  if (isLoading) {
    return null;
  }

  const beforeCreate = params.get('beforeCreate');
  const importHref = createNextHref('/get-started/import', beforeCreate);
  return (
    <PageColumn>
      <PageTop />
      <NavigationTitle title="Get Started" />
      <PageHeading>
        Introducing{' '}
        <span style={{ color: 'var(--primary)' }}>Zerion Wallet</span>
      </PageHeading>
      <Spacer height={4} />
      <UIText kind="subtitle/l_reg">Explore all of Web3 in one place</UIText>

      <Spacer height={32} />

      <Surface padding={16}>
        <VStack gap={16}>
          <NewWalletOption
            beforeCreate={beforeCreate}
            walletGroups={walletGroups || null}
          />
          <UIText kind="subtitle/l_reg" color="var(--neutral-500)">
            <TitleWithLine lineColor="var(--neutral-300)">or</TitleWithLine>
          </UIText>
          <VStack gap={8}>
            <Button kind="regular" as={Link} to={importHref} size={56}>
              Import Existing Wallet
            </Button>
            <UIText kind="subtitle/m_reg" color="var(--neutral-500)">
              Use this option if you want to import an existing wallet using a{' '}
              <em>recovery phrase</em> or a <em>private key</em>
            </UIText>
          </VStack>
        </VStack>
      </Surface>
      <PageBottom />
    </PageColumn>
  );
}

function WalletGroupSelect() {
  const [params] = useSearchParams();
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
  const targetUrl = params.get('next');
  return (
    <PageColumn>
      <PageTop />
      <VStack gap={8}>
        <UIText kind="subtitle/m_reg" color="var(--neutral-500)">
          Wallets (i)
        </UIText>

        <SurfaceList
          items={mnemonicGroups.map((group) => {
            const url = `${targetUrl}?groupId=${group.id}`;
            return {
              key: group.id,
              to: url,
              component: (
                <VStack gap={4}>
                  <UIText kind="subtitle/m_med">
                    {getGroupDisplayName(group.name)}
                  </UIText>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {group.walletContainer.wallets.map((wallet) => (
                      <AddressBadge key={wallet.address} wallet={wallet} />
                    ))}
                  </div>
                </VStack>
              ),
            };
          })}
        />
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
