import { useStore } from '@store-unit/react';
import { useMutation } from '@tanstack/react-query';
import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { FillView } from 'src/ui/components/FillView';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { themeStore } from 'src/ui/features/appearance';
import type { LedgerAccountImport } from 'src/ui/hardware-wallet/types';
import { verifyLedgerAccountImport } from 'src/ui/hardware-wallet/types';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { setCurrentAddress } from 'src/ui/shared/requests/setCurrentAddress';

export function HardwareWalletConnection() {
  const themeState = useStore(themeStore);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    if (!fillRef.current) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const { height } = entry.contentRect;
      setHeight(height);
    });
    const element = fillRef.current;
    observer.observe(element);
    return () => {
      observer.unobserve(element);
    };
  }, []);

  const {
    mutate: finalize,
    isSuccess,
    ...finalizeMutation
  } = useMutation({
    mutationFn: async (params: LedgerAccountImport) => {
      console.log('finalize', params);
      const data = await walletPort.request('uiImportHardwareWallet', params);
      await accountPublicRPCPort.request('saveUserAndWallet');
      await setCurrentAddress({ address: data.address });
      console.log('DONE importing', params);
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
      if (type === 'ledger/import') {
        verifyLedgerAccountImport(params);
        console.log('imported', params);
        finalize(params);
      }
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);
  return (
    <PageColumn>
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
            )}&request-id=${requestId}`}
            style={{ border: 'none', backgroundColor: 'transparent' }}
            width="100%"
            height={height}
            onLoad={() => {
              console.log('iframe loaded');
            }}
            onError={() => {
              console.log('iframe onerror');
            }}
          />
        ) : null}
      </FillView>
      <PageBottom />
    </PageColumn>
  );
}
