import React, { useCallback, useRef } from 'react';
import { invariant } from 'src/shared/invariant';
import { isObj } from 'src/shared/isObj';
import { WebAppMessageHandler } from '../referral-program/WebAppMessageHandler';

/**
 * The Turnstile widget, shared by the bottom sheet and the full-page Security
 * check. The page it loads posts the token to its parent over postMessage.
 */
export function TurnstileFrame({
  onToken,
  onLoad,
  onError,
  width,
  height,
  style,
  autoFocus = false,
}: {
  onToken: (token: string) => void;
  onLoad?: () => void;
  onError?: () => void;
  width: React.CSSProperties['width'];
  height: React.CSSProperties['height'];
  style?: React.CSSProperties;
  autoFocus?: boolean;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const handleToken = useCallback(
    (params: unknown) => {
      invariant(
        isObj(params) && typeof params.token === 'string',
        'Got invalid payload from set-turnstile-token web app message',
      );
      onToken(params.token);
    },
    [onToken],
  );

  const handleLoad = useCallback(() => {
    if (autoFocus) {
      iframeRef.current?.focus();
    }
    onLoad?.();
  }, [autoFocus, onLoad]);

  return (
    <WebAppMessageHandler
      pathname="/turnstile.html"
      callbackName="set-turnstile-token"
      callbackFn={handleToken}
      hidden={false}
      iframeRef={iframeRef}
      title="Cloudflare security check"
      onLoad={handleLoad}
      onError={onError}
      style={{
        width,
        height,
        border: 'none',
        colorScheme: 'auto',
        ...style,
      }}
    />
  );
}
