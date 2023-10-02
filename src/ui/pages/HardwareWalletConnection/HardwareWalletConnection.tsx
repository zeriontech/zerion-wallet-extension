import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useId, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FillView } from 'src/ui/components/FillView';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageFullBleedColumn } from 'src/ui/components/PageFullBleedColumn';
import { PageTop } from 'src/ui/components/PageTop';
import type { LedgerAccountImport } from 'src/ui/hardware-wallet/types';
import { verifyLedgerAccountImport } from 'src/ui/hardware-wallet/types';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { useRenderDelay } from 'src/ui/components/DelayedRender/DelayedRender';
import { invariant } from 'src/shared/invariant';
import { LedgerIframe } from 'src/ui/hardware-wallet/LedgerIframe';
import { isRpcRequest } from 'src/shared/custom-rpc';
import { useAllExistingAddresses } from 'src/ui/shared/requests/useAllExistingAddresses';
import { useIframeHeight } from './useIframeHeight';
import { isAllowedMessage } from './shared/isAllowedMessage';

export function HardwareWalletConnection() {
  const { height, ref: fillRef } = useIframeHeight();

  const ready = useRenderDelay(100);
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();
  const existingAddresses = useAllExistingAddresses();

  const { mutate: finalize } = useMutation({
    mutationFn: async (params: LedgerAccountImport) => {
      const data = await walletPort.request('uiImportHardwareWallet', params);
      await accountPublicRPCPort.request('saveUserAndWallet');
      await setCurrentAddress({ address: data.address });
    },
    onSuccess() {
      navigate(searchParams.get('next') || '/');
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
    <PageFullBleedColumn
      paddingInline={false}
      style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <PageTop />

      <FillView ref={fillRef}>
        {height ? (
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
            }}
            width="100%"
            height={height}
          />
        ) : null}
      </FillView>
      <PageBottom />
    </PageFullBleedColumn>
  );
}
