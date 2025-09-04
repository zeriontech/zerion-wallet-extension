import React, { useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AngleRightRow } from 'src/ui/components/AngleRightRow';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { ViewSuspense } from 'src/ui/components/ViewSuspense';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Toggle } from 'src/ui/ui-kit/Toggle';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import WalletIcon from 'jsx:src/ui/assets/wallet.svg';
import GiftIcon from 'jsx:src/ui/assets/gift.svg';
import LockIcon from 'jsx:src/ui/assets/lock-outline.svg';
import GlobeIcon from 'jsx:src/ui/assets/globe.svg';
import QuestionIcon from 'jsx:src/ui/assets/question-hint.svg';
import BulbIcon from 'jsx:src/ui/assets/bulb.svg';
import PremiumIcon from 'jsx:src/ui/assets/premium.svg';
import ExperimentsIcon from 'jsx:src/ui/assets/experimental.svg';
import DarkModeLampIcon from 'jsx:src/ui/assets/dark-mode-lamp.svg';
import NetworksIcon from 'jsx:src/ui/assets/network.svg';
import SecurityIcon from 'jsx:src/ui/assets/security.svg';
import SettingsIcon from 'jsx:src/ui/assets/settings.svg';
import RewardsIcon from 'jsx:src/ui/assets/rewards.svg';
import ToolsIcon from 'jsx:src/ui/assets/hammer.svg';
import { version } from 'src/shared/packageVersion';
import { apostrophe, middot } from 'src/ui/shared/typography';
import { AppearancePage } from 'src/ui/features/appearance/AppearancePage';
import { usePreferences } from 'src/ui/features/preferences';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import {
  ENABLE_DNA_BANNERS,
  SettingsDnaBanners,
} from 'src/ui/DNA/components/DnaBanners';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { BugReportButton } from 'src/ui/components/BugReportButton';
import { Frame } from 'src/ui/ui-kit/Frame';
import {
  FrameListItemAnchor,
  FrameListItemLink,
} from 'src/ui/ui-kit/FrameList';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { StickyBottomPanel } from 'src/ui/ui-kit/BottomPanel';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { useBackgroundKind } from 'src/ui/components/Background';
import { openHrefInTabIfSidepanel } from 'src/ui/shared/openInTabIfInSidepanel';
import { useWalletParams } from 'src/ui/shared/requests/useWalletParams';
import { invariant } from 'src/shared/invariant';
import { useRemoteConfigValue } from 'src/modules/remote-config/useRemoteConfigValue';
import { FEATURE_LOYALTY_FLOW } from 'src/env/config';
import { emitter } from 'src/ui/shared/events';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import { getCurrentUser } from 'src/shared/getCurrentUser';
import { useStore } from '@store-unit/react';
import { metaAppState } from 'src/ui/shared/meta-app-state';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import { Security } from '../Security';
import { BackupFlowSettingsSection } from './BackupFlowSettingsSection';
import { PreferencesPage } from './Preferences';
import type { PopoverToastHandle } from './PopoverToast';
import { PopoverToast } from './PopoverToast';

const ZERION_ORIGIN = 'https://app.zerion.io';

function SettingsMain() {
  const { singleAddressNormalized } = useAddressParams();
  const navigate = useNavigate();
  const logout = useMutation({
    mutationFn: () => accountPublicRPCPort.request('logout'),
  });

  const { data: loyaltyEnabled } = useRemoteConfigValue(
    'extension_loyalty_enabled'
  );

  const { data: currentWallet } = useQuery({
    queryKey: ['wallet/uiGetCurrentWallet'],
    queryFn: () => {
      return walletPort.request('uiGetCurrentWallet');
    },
  });

  const addressType = currentWallet
    ? getAddressType(currentWallet?.address)
    : null;

  const { mutate: acceptZerionOrigin } = useMutation({
    mutationFn: async () => {
      invariant(currentWallet, 'Current wallet not found');
      return walletPort.request('acceptOrigin', {
        origin: ZERION_ORIGIN,
        address: currentWallet.address,
      });
    },
  });

  const { data: currentUserId } = useQuery({
    queryKey: ['getCurrentUserId'],
    queryFn: async () => (await getCurrentUser())?.id,
    suspense: false,
  });

  const { handleCopy, isSuccess } = useCopyToClipboard({ text: currentUserId });

  const addWalletParams = useWalletParams(currentWallet);

  const { pathname } = useLocation();
  useBackgroundKind({ kind: 'white' });

  const { hasTestWallet } = useStore(metaAppState);
  const evmAddress = currentWallet
    ? isEthereumAddress(currentWallet.address)
    : false;

  return (
    <PageColumn>
      <PageTop />
      <VStack gap={16}>
        <BackupFlowSettingsSection />
        <Frame>
          <VStack gap={0}>
            <FrameListItemLink to="/wallets">
              <AngleRightRow>
                <HStack gap={8} alignItems="center">
                  <WalletIcon />
                  <UIText kind="body/regular">Manage Wallets</UIText>
                </HStack>
              </AngleRightRow>
            </FrameListItemLink>
            <FrameListItemLink to="/connected-sites">
              <AngleRightRow>
                <HStack gap={8} alignItems="center">
                  <GlobeIcon />
                  <UIText kind="body/regular">Connected Sites</UIText>
                </HStack>
              </AngleRightRow>
            </FrameListItemLink>
            <FrameListItemLink to="/networks">
              <AngleRightRow>
                <HStack gap={8} alignItems="center">
                  <NetworksIcon />
                  <UIText kind="body/regular">Networks</UIText>
                </HStack>
              </AngleRightRow>
            </FrameListItemLink>
            <FrameListItemLink to="/settings/developer-tools">
              <AngleRightRow>
                <HStack gap={8} alignItems="center">
                  <ToolsIcon />
                  <UIText kind="body/regular">Developer Tools</UIText>
                </HStack>
              </AngleRightRow>
            </FrameListItemLink>
            {hasTestWallet ? (
              <FrameListItemLink to="/playground">
                <AngleRightRow>
                  <HStack gap={8} alignItems="center">
                    <ExperimentsIcon />
                    <UIText kind="body/regular">Playground</UIText>
                  </HStack>
                </AngleRightRow>
              </FrameListItemLink>
            ) : null}
          </VStack>
        </Frame>
        <Frame>
          <VStack gap={0}>
            {evmAddress ? (
              <FrameListItemLink to="/premium">
                <AngleRightRow>
                  <HStack gap={8} alignItems="center">
                    <PremiumIcon />
                    <UIText kind="body/regular">Zerion Premium</UIText>
                  </HStack>
                </AngleRightRow>
              </FrameListItemLink>
            ) : (
              <FrameListItemAnchor
                href="http://zerion.io/premium"
                target="_blank"
                rel="noopener noreferrer"
              >
                <AngleRightRow kind="link">
                  <HStack gap={8} alignItems="center">
                    <PremiumIcon />
                    <UIText kind="body/regular">Zerion Premium</UIText>
                  </HStack>
                </AngleRightRow>
              </FrameListItemAnchor>
            )}
            {FEATURE_LOYALTY_FLOW === 'on' && loyaltyEnabled ? (
              <FrameListItemLink
                to="/invite"
                onClick={() => {
                  emitter.emit('buttonClicked', {
                    buttonScope: 'Loaylty',
                    buttonName: 'Invite Friends',
                    pathname,
                  });
                }}
              >
                <AngleRightRow>
                  <HStack gap={8} alignItems="center">
                    <GiftIcon />
                    <UIText kind="body/regular">Invite Friends</UIText>
                  </HStack>
                </AngleRightRow>
              </FrameListItemLink>
            ) : null}
            {FEATURE_LOYALTY_FLOW === 'on' &&
            loyaltyEnabled &&
            currentWallet &&
            addressType === 'evm' ? (
              <FrameListItemAnchor
                href={`${ZERION_ORIGIN}/rewards?${addWalletParams}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  emitter.emit('buttonClicked', {
                    buttonScope: 'Loaylty',
                    buttonName: 'Rewards',
                    pathname,
                  });
                  acceptZerionOrigin();
                }}
              >
                <AngleRightRow kind="link">
                  <HStack gap={8} alignItems="center">
                    <RewardsIcon style={{ width: 24, height: 24 }} />
                    <UIText kind="body/regular">Rewards</UIText>
                  </HStack>
                </AngleRightRow>
              </FrameListItemAnchor>
            ) : null}
          </VStack>
        </Frame>
        <Frame>
          <VStack gap={0}>
            <FrameListItemLink to="/settings/security">
              <AngleRightRow>
                <HStack gap={8} alignItems="center">
                  <SecurityIcon />
                  <UIText kind="body/regular">Security</UIText>
                </HStack>
              </AngleRightRow>
            </FrameListItemLink>
            <FrameListItemLink to="/settings/privacy">
              <AngleRightRow>
                <HStack gap={8} alignItems="center">
                  <LockIcon />
                  <UIText kind="body/regular">Privacy</UIText>
                </HStack>
              </AngleRightRow>
            </FrameListItemLink>
            <FrameListItemLink to="/settings/appearance">
              <AngleRightRow>
                <HStack gap={8} alignItems="center">
                  <DarkModeLampIcon />
                  <UIText kind="body/regular">Appearance</UIText>
                </HStack>
              </AngleRightRow>
            </FrameListItemLink>
            <FrameListItemLink to="/settings/preferences">
              <AngleRightRow>
                <HStack gap={8} alignItems="center">
                  <SettingsIcon />
                  <UIText kind="body/regular">Preferences</UIText>
                </HStack>
              </AngleRightRow>
            </FrameListItemLink>
            <FrameListItemLink to="/settings/experiments">
              <AngleRightRow>
                <HStack gap={8} alignItems="center">
                  <ExperimentsIcon />
                  <UIText kind="body/regular">Experiments</UIText>
                </HStack>
              </AngleRightRow>
            </FrameListItemLink>
          </VStack>
        </Frame>

        <Frame>
          <VStack gap={0}>
            <FrameListItemAnchor
              onClick={openHrefInTabIfSidepanel}
              href="https://help.zerion.io/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <AngleRightRow kind="link">
                <HStack gap={8} alignItems="center">
                  <QuestionIcon style={{ width: 24, height: 24 }} />
                  <UIText kind="body/regular">Support & Feedback</UIText>
                </HStack>
              </AngleRightRow>
            </FrameListItemAnchor>
            <BugReportButton />
            <FrameListItemAnchor
              href="https://app.getbeamer.com/zerion/en?category=extension"
              target="_blank"
              rel="noopener noreferrer"
            >
              <AngleRightRow kind="link">
                <HStack gap={8} alignItems="center">
                  <BulbIcon />
                  <UIText kind="body/regular">What{apostrophe}s New</UIText>
                </HStack>
              </AngleRightRow>
            </FrameListItemAnchor>
          </VStack>
        </Frame>
        {ENABLE_DNA_BANNERS ? (
          <SettingsDnaBanners address={singleAddressNormalized} />
        ) : null}
        <UIText kind="small/regular" color="var(--neutral-500)">
          <HStack gap={4} alignItems="center" justifyContent="center">
            <UnstyledAnchor
              target="_blank"
              rel="noopener noreferrer"
              href="https://s3.amazonaws.com/cdn.zerion.io/assets/privacy.pdf"
              className="hover:underline"
            >
              Privacy
            </UnstyledAnchor>
            <span>{middot}</span>
            <UnstyledAnchor
              target="_blank"
              rel="noopener noreferrer"
              href="https://s3.amazonaws.com/cdn.zerion.io/assets/terms.pdf"
              className="hover:underline"
            >
              Terms of use
            </UnstyledAnchor>
            <span>{middot}</span>
            <UnstyledButton
              className="hover:underline"
              disabled={!currentUserId}
              onDoubleClick={handleCopy}
            >
              {isSuccess ? 'ID Copied' : `v${version}`}
            </UnstyledButton>
          </HStack>
        </UIText>
      </VStack>
      <Spacer height={16} />
      <StickyBottomPanel>
        <VStack gap={0} style={{ padding: 16 }}>
          <Button
            kind="primary"
            onClick={async () => {
              await logout.mutateAsync();
              navigate('/login');
            }}
          >
            <HStack gap={8} alignItems="center" justifyContent="center">
              <LockIcon style={{ color: 'var(--white)' }} />
              <UIText kind="body/accent" color="var(--white)">
                {logout.isLoading ? 'Locking...' : 'Lock Wallet'}
              </UIText>
            </HStack>
          </Button>
        </VStack>
      </StickyBottomPanel>
    </PageColumn>
  );
}

function ToggleSettingLine({
  checked,
  onChange,
  text,
  detailText,
}: {
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  text: NonNullable<React.ReactNode>;
  detailText: React.ReactNode | null;
}) {
  return (
    <HStack gap={4} justifyContent="space-between" style={{ padding: 12 }}>
      <VStack gap={0}>
        <UIText kind="body/accent">{text}</UIText>
        {detailText ? (
          <UIText kind="small/regular" color="var(--neutral-500)">
            {detailText}
          </UIText>
        ) : null}
      </VStack>
      <Toggle checked={checked} onChange={onChange} />
    </HStack>
  );
}

function ClearPendingTransactionsLine() {
  const toastRef = useRef<PopoverToastHandle>(null);
  const { mutate: clearPendingTransactions, ...mutation } = useMutation({
    mutationFn: async () => {
      await new Promise((r) => setTimeout(r, 500)); // artificial delay
      toastRef.current?.removeToast();
      return walletPort.request('clearPendingTransactions');
    },
    onSuccess: () => {
      toastRef.current?.showToast();
    },
  });
  return (
    <>
      <PopoverToast ref={toastRef}>Pending transactions cleared</PopoverToast>

      <Frame
        as={UnstyledButton}
        interactiveStyles={true}
        onClick={() => clearPendingTransactions()}
        disabled={mutation.isLoading}
        style={{ padding: 20, textAlign: 'start' }}
      >
        <VStack gap={0}>
          <UIText kind="body/accent">Clear Pending Transactions</UIText>
          <UIText kind="small/regular" color="var(--neutral-500)">
            This can fix stuck transactions
          </UIText>
        </VStack>
      </Frame>
    </>
  );
}

function DeveloperTools() {
  const { globalPreferences, setGlobalPreferences } = useGlobalPreferences();
  const { preferences, setPreferences } = usePreferences();
  useBackgroundKind({ kind: 'white' });

  return (
    <PageColumn>
      <NavigationTitle title="Developer Tools" />
      <PageTop />
      <VStack gap={16}>
        <Frame>
          <ToggleSettingLine
            text="Custom Nonce"
            checked={preferences?.configurableNonce ?? false}
            onChange={(event) => {
              setPreferences({
                configurableNonce: event.target.checked,
              });
            }}
            detailText={
              <span>
                Set your own unique nonce to control
                <br />
                transaction order
              </span>
            }
          />
          <ToggleSettingLine
            text="Recognizable Connect Buttons"
            checked={globalPreferences?.recognizableConnectButtons || false}
            onChange={(event) => {
              setGlobalPreferences({
                recognizableConnectButtons: event.target.checked,
              });
            }}
            detailText={
              <span>
                When enabled, we add Zerion Wallet label to connect buttons in
                DApps so that they{apostrophe}re easier to spot
              </span>
            }
          />
        </Frame>
        <Frame>
          <ToggleSettingLine
            text="Testnet Mode"
            checked={Boolean(preferences?.testnetMode)}
            onChange={(event) => {
              setPreferences({
                testnetMode: event.target.checked ? { on: true } : null,
              });
            }}
            detailText={
              <div>
                Enables viewing and interacting with test networks. <br />
                When enabled, use{' '}
                <kbd
                  style={{
                    padding: '2px 4px',
                    background: 'var(--neutral-200)',
                    borderRadius: 4,
                    color: 'var(--black)',
                  }}
                >
                  T
                </kbd>{' '}
                shortcut to switch quickly between modes.
              </div>
            }
          />
        </Frame>
        <ClearPendingTransactionsLine />
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}

function Privacy() {
  const { globalPreferences, setGlobalPreferences } = useGlobalPreferences();
  useBackgroundKind({ kind: 'white' });

  return (
    <PageColumn>
      <NavigationTitle title="Privacy" />
      <PageTop />
      <Frame>
        <ToggleSettingLine
          text="Share App Usage Analytics"
          checked={globalPreferences?.analyticsEnabled ?? true}
          onChange={(event) => {
            setGlobalPreferences({
              analyticsEnabled: event.target.checked,
            });
          }}
          detailText={
            <span>
              Help us improve our app experience by sharing anonymous statistics
              about how you use Zerion. We will not associate any of this to you
              and your personal data will not be sent to us. Read more in our{' '}
              <UnstyledAnchor
                href="https://s3.amazonaws.com/cdn.zerion.io/assets/privacy.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                Privacy Policy
              </UnstyledAnchor>
              .
            </span>
          }
        />
      </Frame>
      <PageBottom />
    </PageColumn>
  );
}

function Experiments() {
  const { preferences, setPreferences } = usePreferences();
  useBackgroundKind({ kind: 'white' });

  return (
    <PageColumn>
      <NavigationTitle title="Experiments" />
      <PageTop />
      <Frame>
        <ToggleSettingLine
          text="Hold to Sign"
          checked={preferences?.enableHoldToSignButton || false}
          onChange={(event) => {
            setPreferences({
              enableHoldToSignButton: event.target.checked,
            });
          }}
          detailText={
            <span>
              Sign transactions with a long click to avoid accidental signing
            </span>
          }
        />
      </Frame>
      <PageBottom />
    </PageColumn>
  );
}

export function Settings() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ViewSuspense>
            <SettingsMain />
          </ViewSuspense>
        }
      />
      <Route
        path="/developer-tools"
        element={
          <ViewSuspense>
            <DeveloperTools />
          </ViewSuspense>
        }
      />
      <Route
        path="/appearance"
        element={
          <ViewSuspense>
            <AppearancePage />
          </ViewSuspense>
        }
      />
      <Route
        path="/security/*"
        element={
          <ViewSuspense>
            <Security />
          </ViewSuspense>
        }
      />
      <Route
        path="/privacy/*"
        element={
          <ViewSuspense>
            <Privacy />
          </ViewSuspense>
        }
      />
      <Route
        path="/preferences/*"
        element={
          <ViewSuspense>
            <PreferencesPage />
          </ViewSuspense>
        }
      />
      <Route
        path="/experiments/*"
        element={
          <ViewSuspense>
            <Experiments />
          </ViewSuspense>
        }
      />
    </Routes>
  );
}
