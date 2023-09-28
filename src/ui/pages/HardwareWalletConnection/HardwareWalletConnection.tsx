import { useStore } from '@store-unit/react';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useId } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FillView } from 'src/ui/components/FillView';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageFullBleedColumn } from 'src/ui/components/PageFullBleedColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { themeStore } from 'src/ui/features/appearance';
import type { LedgerAccountImport } from 'src/ui/hardware-wallet/types';
import { verifyLedgerAccountImport } from 'src/ui/hardware-wallet/types';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';
import { useRenderDelay } from 'src/ui/components/DelayedRender/DelayedRender';
import { useIframeHeight } from './useIframeHeight';

export function HardwareWalletConnection() {
  const themeState = useStore(themeStore);
  const { height, ref: fillRef } = useIframeHeight();

  const ready = useRenderDelay(300);
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const { mutate: finalize } = useMutation({
    mutationFn: async (params: LedgerAccountImport) => {
      console.log('finalize', params);
      const data = await walletPort.request('uiImportHardwareWallet', params);
      await accountPublicRPCPort.request('saveUserAndWallet');
      await setCurrentAddress({ address: data.address });
      console.log('DONE importing', params);
    },
    onSuccess() {
      navigate(searchParams.get('next') || '/');
    },
  });

  const requestId = useId();

  useEffect(() => {
    function handler(event: MessageEvent) {
      console.log('HardwareConnection', event);

      // NOTE:
      // Checking the origin of a sandboxed iframe:
      // https://web.dev/sandboxed-iframes/#safely-sandboxing-eval
      // TODO:

      if (!event.data) {
        return;
      }
      const { id, data } = event.data;
      if (id !== requestId) {
        console.log('wrong requets id', id, data);
        return;
      }
      const { type, params } = data;
      if (type === 'ledger/connect') {
        navigate(searchParams.get('next') || '/');
      } else if (type === 'ledger/import') {
        verifyLedgerAccountImport(params);
        console.log('imported', params);
        finalize(params);
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
          <iframe
            id="the-ledger-test"
            // This is crucial: by lifting only "allow-scripts" restriction
            // we restrict everything else, inluding "allow-same-origin" token.
            // By doing this, the iframe code will be treated by the background script
            // as a third-party origin.
            sandbox="allow-scripts"
            allow="usb"
            src={`ui/hardware-wallet/ledger.html?theme-state=${encodeURIComponent(
              JSON.stringify(themeState)
            )}&request-id=${requestId}&#/?strategy=${
              searchParams.get('strategy') || 'import'
            }`}
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
