import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useId, useMemo, useRef } from 'react';
import { Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import { FillView } from 'src/ui/components/FillView';
import { PageFullBleedColumn } from 'src/ui/components/PageFullBleedColumn';
import type { LedgerAccountImport } from 'src/ui/hardware-wallet/types';
import { verifyLedgerAccountImport } from 'src/ui/hardware-wallet/types';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { useRenderDelay } from 'src/ui/components/DelayedRender/DelayedRender';
import { invariant } from 'src/shared/invariant';
import { LedgerIframe } from 'src/ui/hardware-wallet/LedgerIframe';
import { isRpcRequest } from 'src/shared/custom-rpc';
import { useAllSignerOrHwAddresses } from 'src/ui/shared/requests/useAllExistingAddresses';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import {
  useBackgroundKind,
  useBodyStyle,
} from 'src/ui/components/Background/Background';
import { NavigationBackButton } from 'src/ui/components/NavigationBackButton';
import { PageColumn } from 'src/ui/components/PageColumn';
import FullTextLogo from 'jsx:src/ui/assets/zerion-full-logo.svg';
import { PrivacyFooter } from 'src/ui/components/PrivacyFooter';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { isAllowedMessage } from './shared/isAllowedMessage';
import { ImportSuccess } from './ImportSuccess';
import { getWalletInfo } from './shared/getWalletInfo';

export function FrameLayout({
  children,
  showBackButton,
}: React.PropsWithChildren<{ showBackButton?: boolean }>) {
  useBackgroundKind({ kind: 'transparent' });
  useBodyStyle(useMemo(() => ({ border: 'none' }), []));

  return (
    <PageFullBleedColumn
      paddingInline={false}
      style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <NavigationTitle
        urlBar="none"
        title={null}
        documentTitle="Connect your Ledger"
      />
      <div
        style={{
          display: 'grid',
          gridTemplateRows: 'auto minmax(620px, 1fr) auto',
          paddingInline: 16,
        }}
      >
        <div style={{ paddingTop: 24, paddingBottom: 25 }}>
          <FullTextLogo />
        </div>
        <div
          style={{
            flexGrow: 1,
            backgroundColor: 'var(--white)',
            borderRadius: 16,
            overflow: 'auto',
            boxShadow: 'var(--elevation-200)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {showBackButton ? (
            <PageColumn style={{ paddingTop: 16, paddingBottom: 24 }}>
              <div>
                <NavigationBackButton />
              </div>
            </PageColumn>
          ) : (
            <Spacer height={100} />
          )}
          <FillView
            // grow children
            style={{ display: 'flex' }}
          >
            {children}
          </FillView>
        </div>
        <footer style={{ paddingTop: 32, paddingBottom: 36 }}>
          <PrivacyFooter />
        </footer>
      </div>
    </PageFullBleedColumn>
  );
}
export function HardwareWalletConnectionStart({
  onImport,
}: {
  onImport?(params: LedgerAccountImport): void;
}) {
  const ready = useRenderDelay(100);
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();
  const existingAddresses = useAllSignerOrHwAddresses();
  const { globalPreferences, setGlobalPreferences } = useGlobalPreferences();

  const { mutate: finalize } = useMutation({
    mutationFn: async (params: LedgerAccountImport) => {
      const data = await walletPort.request('uiImportHardwareWallet', params);
      await accountPublicRPCPort.request('saveUserAndWallet');
      await setCurrentAddress({ address: data.address });
      return params;
    },
    onSuccess(result) {
      const next = searchParams.get('next') || '/';
      const addresses = result.accounts.map((account) => account.address);
      const params = new URLSearchParams({ next });
      for (const address of addresses) {
        params.append('address', address);
      }
      navigate(`import-success?${params}`);
    },
  });

  const requestId = useId();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const { currency } = useCurrency();

  useEffect(() => {
    async function handler(event: MessageEvent) {
      invariant(iframeRef.current, 'Iframe should be mounted');
      if (!isAllowedMessage(event, iframeRef.current)) {
        return;
      }
      if (isRpcRequest(event.data)) {
        const { method, params, id } = event.data;
        if (method === 'ledger/connect') {
          navigate(searchParams.get('next') || '/', {
            replace: searchParams.get('replaceAfterRedirect') === 'true',
          });
        } else if (method === 'ledger/import') {
          verifyLedgerAccountImport(params);
          if (onImport) {
            onImport(params);
          } else {
            finalize(params);
          }
        } else if (method === 'wallet-info') {
          const result = await getWalletInfo(
            (params as { address: string }).address,
            currency
          );
          if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ id, result }, '*');
          }
        } else if (method === 'ledger/enable-bluetooth') {
          setGlobalPreferences({
            bluetoothSupportEnabled: true,
          });
        }
      }
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [
    finalize,
    onImport,
    navigate,
    requestId,
    searchParams,
    currency,
    setGlobalPreferences,
  ]);

  if (!globalPreferences) {
    return null;
  }

  return (
    <LedgerIframe
      ref={iframeRef}
      appSearchParams={new URLSearchParams({
        strategy: searchParams.get('strategy') || 'import',
        'existingAddresses[]': existingAddresses?.join(',') ?? '',
        supportBluetooth:
          globalPreferences?.bluetoothSupportEnabled != null
            ? `${globalPreferences.bluetoothSupportEnabled}`
            : '',
      }).toString()}
      style={{
        border: 'none',
        backgroundColor: 'transparent',
        opacity: ready ? 1 : 0, // prevent iframe dark theme flicker
        flexGrow: 1,
      }}
      width="100%"
    />
  );
}

export function HardwareWalletConnection() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <FrameLayout showBackButton={true}>
            <HardwareWalletConnectionStart />
          </FrameLayout>
        }
      />
      <Route
        path="/import-success"
        element={
          <FrameLayout showBackButton={false}>
            <ImportSuccess />
          </FrameLayout>
        }
      />
    </Routes>
  );
}
