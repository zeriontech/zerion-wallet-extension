import React from 'react';
import { useStore } from '@store-unit/react';
import { useRenderDelay } from 'src/ui/components/DelayedRender/DelayedRender';
import { themeStore } from 'src/ui/features/appearance';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import ErrorIcon from 'jsx:src/ui/assets/warning.svg';

// USB connection doesn't supported in Firefox
// so we should show a warning to the user
function isUsbConnectionSupported() {
  return 'usb' in navigator;
}

export const LedgerIframe = React.forwardRef(function LedgerIframeComponent(
  {
    appSearchParams,
    initialRoute = '/',
    style,
    ...props
  }: React.IframeHTMLAttributes<HTMLIFrameElement> & {
    initialRoute?: string;
    appSearchParams?: string;
  },
  ref: React.ForwardedRef<HTMLIFrameElement>
) {
  const themeState = useStore(themeStore);
  const { currency } = useCurrency();
  const ready = useRenderDelay(100);

  const ledgerConnectionSupported = isUsbConnectionSupported();

  if (!ledgerConnectionSupported) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
          padding: '0px 32px 40px',
        }}
      >
        <VStack gap={4} style={{ textAlign: 'center', justifyItems: 'center' }}>
          <ErrorIcon
            style={{ width: 48, height: 48, color: 'var(--notice-500)' }}
          />
          <VStack gap={4}>
            <UIText kind="headline/h3">
              Ledger is not supported in Firefox
            </UIText>
            <UIText kind="body/regular" color="var(--neutral-500)">
              Please try a different browser
            </UIText>
          </VStack>
        </VStack>
      </div>
    );
  }

  return (
    <iframe
      ref={ref}
      width="100%"
      id="iframe-component"
      {...props}
      // This is crucial: by lifting only "allow-scripts" restriction
      // we restrict everything else, including "allow-same-origin" token.
      // By doing this, the iframe code will be treated by the background script
      // as a third-party origin.
      sandbox="allow-scripts"
      allow="usb"
      src={`ui/hardware-wallet/ledger.html?theme-state=${encodeURIComponent(
        JSON.stringify(themeState)
      )}&currency=${currency}#${initialRoute}?${appSearchParams}`}
      style={{
        border: 'none',
        backgroundColor: 'transparent',
        opacity: ready ? 1 : 0, // prevent iframe dark theme flicker
        ...style,
      }}
    />
  );
});
