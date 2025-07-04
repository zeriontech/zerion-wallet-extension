import { useQuery } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { BrowserStorage } from 'src/background/webapis/storage';
import { analyticsIdKey } from 'src/shared/analytics/analyticsId';
import { setAnalyticsIdIfNeeded } from 'src/shared/analytics/analyticsId.client';
import { deviceIdStore } from 'src/shared/analytics/shared/DeviceIdStore';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { WebAppMessageHandler } from 'src/ui/features/referral-program/WebAppMessageHandler';

function AnalyticsIdFallback() {
  useEffect(() => {
    deviceIdStore.getSavedState().then((id) => {
      setAnalyticsIdIfNeeded(id);
    });
  }, []);
  return null;
}

export function AnalyticsIdHandler() {
  const { data, isLoading } = useQuery({
    queryKey: ['getAnalyticsId'],
    queryFn: async () => {
      return (await BrowserStorage.get<string>(analyticsIdKey)) || null;
    },
    suspense: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  if (isLoading || data) {
    return null; // If loading or userId already set, do not render anything
  }

  return (
    <>
      <DelayedRender delay={5000}>
        <AnalyticsIdFallback />
      </DelayedRender>
      <WebAppMessageHandler
        pathname="/user-id"
        callbackName="set-user-id"
        callbackFn={(userId) => {
          setAnalyticsIdIfNeeded(userId as string);
        }}
        hidden={true}
      />
    </>
  );
}
