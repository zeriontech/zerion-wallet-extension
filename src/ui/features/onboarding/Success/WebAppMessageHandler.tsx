import React, { useEffect, useRef } from 'react';
import { invariant } from 'src/shared/invariant';
import { isObj } from 'src/shared/isObj';

const ZERION_WEB_APP_URL = new URL(
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://app.zerion.io'
);

enum WebAppCallbackMethod {
  SetReferralCode = 'set-referral-code',
}

interface WebAppMessage<T = unknown> {
  method: WebAppCallbackMethod;
  params?: T;
}

export function isWebAppMessage(
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

function setReferralCode(_referralCode: string) {
  // save referralCode
  // apply to owned wallets
}

async function handleMessage({
  event,
  expectedSource,
}: {
  event: MessageEvent;
  expectedSource: Window | null;
}) {
  if (!isWebAppMessage(event, { expectedSource })) return;
  const { method, params } = event.data;

  if (method === WebAppCallbackMethod.SetReferralCode) {
    invariant(
      isObj(params) && typeof params.referralCode === 'string',
      'Invalid payload for set-referral-code web app message'
    );

    setReferralCode(params.referralCode);
  }
}

export function WebAppMessageHandler({ path }: { path: string }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const iframeUrl = new URL(path, ZERION_WEB_APP_URL);

  useEffect(() => {
    invariant(iframeRef.current, 'Iframe should be mounted');
    const webAppWindow = iframeRef.current.contentWindow;

    const handler = (event: MessageEvent) =>
      handleMessage({ event, expectedSource: webAppWindow });

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <iframe
      sandbox="allow-same-origin allow-scripts"
      ref={iframeRef}
      src={iframeUrl.toString()}
      hidden={true}
    />
  );
}
