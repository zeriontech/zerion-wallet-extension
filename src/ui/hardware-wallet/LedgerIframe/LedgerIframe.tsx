import React from 'react';
import { useStore } from '@store-unit/react';
import { useRenderDelay } from 'src/ui/components/DelayedRender/DelayedRender';
import { themeStore } from 'src/ui/features/appearance';
import { useCurrency } from 'src/modules/currency/useCurrency';

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
  return (
    <iframe
      ref={ref}
      width="100%"
      id="iframe-component"
      {...props}
      // This is crucial: by lifting only "allow-scripts" restriction
      // we restrict everything else, inluding "allow-same-origin" token.
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
