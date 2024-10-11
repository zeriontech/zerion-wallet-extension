import React, { useEffect, useRef } from 'react';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { invariant } from 'src/shared/invariant';
import { isObj } from 'src/shared/isObj';

const ZERION_WEB_APP_URL = new URL('https://app.zerion.io');

type WebAppCallbackMethod = 'set-referral-code';

interface WebAppMessage {
  method: WebAppCallbackMethod;
  params?: unknown;
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

async function setReferralCode(referralCode: string) {
  const response = await ZerionAPI.checkReferral({ referralCode });
  // @ts-ignore
  const checkedReferrer = response.data;
  // await saveReferrer(checkedReferrer);
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

  if (method === 'set-referral-code') {
    invariant(
      isObj(params) && typeof params.referralCode === 'string',
      'Invalid payload for set-referral-code web app message'
    );

    await setReferralCode(params.referralCode);
  }
}

export function WebAppMessageHandler({ pathname }: { pathname: string }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const iframeUrl = new URL(pathname, ZERION_WEB_APP_URL);

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
