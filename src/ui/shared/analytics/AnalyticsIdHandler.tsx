import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { BrowserStorage } from 'src/background/webapis/storage';
import { analyticsIdKey } from 'src/shared/analytics/analyticsId';
import { setAnalyticsIdIfNeeded } from 'src/shared/analytics/analyticsId.client';
import { invariant } from 'src/shared/invariant';
import { isObj } from 'src/shared/isObj';
import { WebAppMessageHandler } from 'src/ui/features/referral-program/WebAppMessageHandler';

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
    <WebAppMessageHandler
      pathname="/user-id"
      callbackName="set-user-id"
      callbackFn={(params) => {
        invariant(
          isObj(params) && typeof params.userId === 'string',
          'Got invalid payload from set-referral-code web app message'
        );
        setAnalyticsIdIfNeeded(params.userId);
      }}
      hidden={true}
    />
  );
}
