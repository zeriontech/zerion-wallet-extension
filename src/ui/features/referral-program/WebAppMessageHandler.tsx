import React, { useEffect, useRef } from 'react';
import { invariant } from 'src/shared/invariant';
import { isObj } from 'src/shared/isObj';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { emitter } from 'src/ui/shared/events';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import { saveReferrerData } from './shared/storage';

const ZERION_WEB_APP_URL = new URL('https://beta.zerion.io');

type WebAppCallbackMethod = 'set-referral-code' | 'set-turnstile-token';

interface WebAppMessage {
  method: WebAppCallbackMethod;
  params?: unknown;
}

function isWebAppMessage(
  event: MessageEvent,
  {
    expectedSource,
  }: {
    expectedSource: Window | null;
  }
): event is MessageEvent<WebAppMessage> {
  return (
    event.origin === ZERION_WEB_APP_URL.origin &&
    event.source === expectedSource &&
    isObj(event.data) &&
    'method' in event.data
  );
}

export function WebAppMessageHandler({
  pathname,
  callbackName,
  callbackFn,
  hidden,
  style,
}: {
  pathname: string;
  callbackName: WebAppCallbackMethod;
  callbackFn: (params?: unknown) => Promise<void>;
  hidden?: boolean;
  style?: React.CSSProperties;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const iframeUrl = new URL(pathname, ZERION_WEB_APP_URL);

  useEffect(() => {
    invariant(iframeRef.current, 'Iframe should be mounted');
    const webAppWindow = iframeRef.current.contentWindow;

    const handler = (event: MessageEvent) => {
      if (!isWebAppMessage(event, { expectedSource: webAppWindow })) return;
      if (event.data.method === callbackName) {
        callbackFn(event.data.params);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [callbackFn, callbackName]);

  return (
    <iframe
      sandbox="allow-same-origin allow-scripts"
      ref={iframeRef}
      src={iframeUrl.toString()}
      hidden={hidden}
      style={style}
    />
  );
}

function sanitizeReferralCode(unsafeValue: string) {
  const safeValue = unsafeValue.trim().replace(/[^A-Z0-9]/g, '');
  return safeValue.length > 3 && safeValue.length < 24 ? safeValue : null;
}

async function setReferralCode(params: unknown) {
  invariant(
    isObj(params) && typeof params.referralCode === 'string',
    'Got invalid payload from set-referral-code web app message'
  );

  const sanitizedReferralCode = sanitizeReferralCode(params.referralCode);
  if (!sanitizedReferralCode) {
    throw new Error('Invalid referral code format or length');
  }

  const checkReferralResponse = await ZerionAPI.checkReferral({
    referralCode: sanitizedReferralCode,
  });
  const checkedReferrer = checkReferralResponse.data;
  await saveReferrerData(checkedReferrer);
}

export function ReferralProgramHandler() {
  return (
    <WebAppMessageHandler
      pathname="/referral/get-code"
      callbackName="set-referral-code"
      callbackFn={setReferralCode}
      hidden={true}
    />
  );
}

async function logTurnstileToken(params: unknown) {
  invariant(
    isObj(params) && typeof params.token === 'string',
    'Got invalid payload from set-referral-code web app message'
  );
  emitter.emit('closeTurnstile');
}

export function TurnstileTokenHandler() {
  const { innerWidth } = useWindowSizeStore();
  const turnstileWidgetHeight = 65;
  const turnstileWidgetWidth = innerWidth - 32;
  return (
    <WebAppMessageHandler
      pathname="/turnstile"
      callbackName="set-turnstile-token"
      callbackFn={logTurnstileToken}
      hidden={false}
      style={{
        width: turnstileWidgetWidth,
        height: turnstileWidgetHeight,
        border: 'none',
      }}
    />
  );
}
