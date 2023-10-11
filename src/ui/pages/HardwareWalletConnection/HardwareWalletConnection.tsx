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
import { useAllExistingAddresses } from 'src/ui/shared/requests/useAllExistingAddresses';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import {
  useBackgroundKind,
  useBodyStyle,
} from 'src/ui/components/Background/Background';
import { UIText } from 'src/ui/ui-kit/UIText';
import { NavigationBackButton } from 'src/ui/components/NavigationBackButton';
import { PageColumn } from 'src/ui/components/PageColumn';
import FullTextLogo from 'jsx:src/ui/assets/zerion-full-logo.svg';
import lockIconSrc from 'src/ui/Onboarding/assets/lock.png';
import { HStack } from 'src/ui/ui-kit/HStack';
import { isAllowedMessage } from './shared/isAllowedMessage';
import { ImportSuccess } from './ImportSuccess';

function FrameLayout({ children }: React.PropsWithChildren) {
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
          flexGrow: 1,
          display: 'grid',
          gridTemplateRows: 'auto minmax(650px, 1fr) auto',
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
          <PageColumn style={{ paddingTop: 16, paddingBottom: 24 }}>
            <div>
              <NavigationBackButton />
            </div>
          </PageColumn>
          <FillView
            // grow children
            style={{ display: 'flex' }}
          >
            {children}
          </FillView>
        </div>
        <footer style={{ paddingTop: 32, paddingBottom: 36 }}>
          <HStack gap={8}>
            <img src={lockIconSrc} alt="" style={{ width: 20, height: 20 }} />
            <UIText kind="small/accent" color="var(--neutral-600)">
              We never store your keys, collect your full IP address, sell or
              share your data. See here for our full policy.
            </UIText>
          </HStack>
        </footer>
      </div>
    </PageFullBleedColumn>
  );
}
function HardwareWalletConnectionStart() {
  const ready = useRenderDelay(100);
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();
  const existingAddresses = useAllExistingAddresses();

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

  useEffect(() => {
    function handler(event: MessageEvent) {
      invariant(iframeRef.current, 'Iframe should be mounted');
      if (!isAllowedMessage(event, iframeRef.current)) {
        return;
      }
      if (isRpcRequest(event.data)) {
        const { method, params } = event.data;
        if (method === 'ledger/connect') {
          navigate(searchParams.get('next') || '/');
        } else if (method === 'ledger/import') {
          verifyLedgerAccountImport(params);
          finalize(params);
        }
      }
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [finalize, navigate, requestId, searchParams]);
  return (
    <LedgerIframe
      ref={iframeRef}
      appSearchParams={new URLSearchParams({
        strategy: searchParams.get('strategy') || 'import',
        'existingAddresses[]': existingAddresses?.join(',') ?? '',
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
    <FrameLayout>
      <Routes>
        <Route path="/" element={<HardwareWalletConnectionStart />} />
        <Route path="/import-success" element={<ImportSuccess />} />
      </Routes>
    </FrameLayout>
  );
}
