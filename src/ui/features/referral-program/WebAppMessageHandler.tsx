import React, { useEffect, useRef } from 'react';
import { invariant } from 'src/shared/invariant';
import { isObj } from 'src/shared/isObj';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { saveReferrerData } from './shared/storage';

const ZERION_WEB_APP_URL = new URL('https://app.zerion.io');

type WebAppCallbackMethod = 'set-referral-code';

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
}: {
  pathname: string;
  callbackName: WebAppCallbackMethod;
  callbackFn: (params?: unknown) => Promise<void>;
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
      hidden={true}
    />
  );
}

async function setReferralCode(params: unknown) {
  invariant(
    isObj(params) && typeof params.referralCode === 'string',
    'Got invalid payload from set-referral-code web app message'
  );

  const checkReferralResponse = await ZerionAPI.checkReferral({
    referralCode: params.referralCode,
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
    />
  );
}
