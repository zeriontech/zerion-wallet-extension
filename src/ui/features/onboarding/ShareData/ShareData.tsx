import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { useMutation } from '@tanstack/react-query';
import { useOnboardingSession } from '../shared/useOnboardingSession';
import * as helpersStyles from '../shared/helperStyles.module.css';

export function ShareData() {
  const navigate = useNavigate();
  const { globalPreferences, setGlobalPreferences, query } =
    useGlobalPreferences();
  const { isNarrowView } = useWindowSizeStore();

  useOnboardingSession({ navigateOnExistingUser: 'success' });

  // Check if analyticsEnabled is already set and navigate to welcome
  useEffect(() => {
    if (!query.isLoading && globalPreferences?.analyticsEnabled != null) {
      navigate('/onboarding/welcome');
    }
  }, [query.isLoading, globalPreferences?.analyticsEnabled, navigate]);

  const handleAnalyticsChoiceMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return setGlobalPreferences({
        analyticsEnabled: enabled,
      });
    },
    onSuccess: () => {
      navigate('/onboarding/welcome');
    },
  });

  if (query.isLoading) {
    return null;
  }

  return (
    <VStack gap={isNarrowView ? 24 : 40}>
      <VStack
        gap={24}
        className={helpersStyles.appear}
        style={{
          animationDuration: '500ms',
          borderRadius: 20,
          boxShadow: '0px 12px 44px 0px rgba(0, 0, 0, 0.08)',
          padding: isNarrowView ? '40px 24px' : '60px 48px',
          backgroundColor: 'var(--white)',
          maxWidth: 500,
          margin: '0 auto',
        }}
      >
        <VStack gap={16}>
          <UIText
            kind={isNarrowView ? 'headline/h2' : 'headline/h1'}
            style={{
              fontSize: isNarrowView ? 28 : 36,
              fontWeight: 600,
              lineHeight: isNarrowView ? '36px' : '44px',
              color: 'var(--black)',
            }}
          >
            Privacy and
            <br /> Data Collection
          </UIText>
          <UIText
            kind="body/accent"
            color="var(--neutral-600)"
            style={{
              maxWidth: 480,
              lineHeight: '24px',
            }}
          >
            Share anonymous usage data (such as app interactions, feature usage,
            and performance metrics) to help us make Zerion better for everyone.
            <br />
            <br />
            Turning off data collection will not impact your user experience.
            You can change this setting anytime in Privacy settings.
            <br />
            <br />
            Read more in our{' '}
            <UnstyledAnchor
              href="https://s3.amazonaws.com/cdn.zerion.io/assets/privacy.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              Privacy Policy
            </UnstyledAnchor>
            .
          </UIText>
        </VStack>

        <VStack gap={12} style={{ width: '100%', maxWidth: 400 }}>
          <Button
            kind="primary"
            size={48}
            onClick={() => handleAnalyticsChoiceMutation.mutate(true)}
            disabled={handleAnalyticsChoiceMutation.isLoading}
            style={{ width: '100%' }}
          >
            <UIText kind="body/accent" color="var(--white)">
              Agree to anonymous data collection
            </UIText>
          </Button>
          <Button
            kind="regular"
            size={48}
            onClick={() => handleAnalyticsChoiceMutation.mutate(false)}
            disabled={handleAnalyticsChoiceMutation.isLoading}
            style={{ width: '100%' }}
          >
            <UIText kind="body/accent">Deny anonymous data collection</UIText>
          </Button>
        </VStack>
      </VStack>
    </VStack>
  );
}
