import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { animated, useTransition } from '@react-spring/web';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import { PLATFORM } from 'src/env/config';
import { useRemoteConfigValue } from 'src/modules/remote-config/useRemoteConfigValue';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { openUrl } from 'src/ui/shared/openUrl';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { TextLink } from 'src/ui/ui-kit/TextLink';
import * as styles from './PromoToaster.module.css';

const EXPECTED_PROMO_VERSION = 1;

const STORE_URLS: Record<string, string> = {
  chrome:
    'https://chrome.google.com/webstore/detail/zerion-wallet-for-web3-nf/klghhnkeealcohjjanjjdaeeggmfmlpl',
  firefox: 'https://addons.mozilla.org/en-US/firefox/addon/zerion-wallet/',
};

function isInternalLink(link: string) {
  return link.startsWith('/');
}

function PromoToasterInner() {
  const navigate = useNavigate();
  const { data: promoConfig } = useRemoteConfigValue('extension_promo_config');
  const { globalPreferences, setGlobalPreferences } = useGlobalPreferences();
  const [dismissed, setDismissed] = useState(false);

  const lastSeenPromoId = globalPreferences?.lastSeenPromoId;

  const hasConfig = promoConfig != null && promoConfig.id !== '';
  const versionMatches =
    hasConfig && promoConfig.version === EXPECTED_PROMO_VERSION;
  const versionMismatch =
    hasConfig && promoConfig.version !== EXPECTED_PROMO_VERSION;

  const showPromo =
    versionMatches && promoConfig.id !== lastSeenPromoId && !dismissed;
  const updateNudgeId = versionMismatch ? `update-nudge-${promoConfig.id}` : '';
  const showUpdateNudge =
    versionMismatch && updateNudgeId !== lastSeenPromoId && !dismissed;

  const isVisible = showPromo || showUpdateNudge;

  const transitions = useTransition(isVisible ? [1] : [], {
    from: { opacity: 0, transform: 'translateY(24px) scale(0.96)' },
    enter: { opacity: 1, transform: 'translateY(0px) scale(1)' },
    leave: { opacity: 0, transform: 'translateY(16px) scale(0.98)' },
    config: { tension: 400, friction: 28 },
  });

  const handleDismiss = () => {
    setDismissed(true);
    if (showPromo && promoConfig) {
      setGlobalPreferences({ lastSeenPromoId: promoConfig.id });
    } else if (showUpdateNudge) {
      setGlobalPreferences({ lastSeenPromoId: updateNudgeId });
    }
  };

  const handleCtaClick = () => {
    if (showPromo && promoConfig) {
      setGlobalPreferences({ lastSeenPromoId: promoConfig.id });
      if (isInternalLink(promoConfig.ctaLink)) {
        navigate(promoConfig.ctaLink);
      } else {
        openUrl(new URL(promoConfig.ctaLink));
      }
    } else if (showUpdateNudge) {
      setGlobalPreferences({ lastSeenPromoId: updateNudgeId });
      const storeUrl = STORE_URLS[PLATFORM] || STORE_URLS.chrome;
      openUrl(new URL(storeUrl));
    }
    setDismissed(true);
  };

  const imgSrc = showPromo ? promoConfig?.imgSrc : undefined;
  const title = showPromo ? promoConfig?.title : 'A new version is available';
  const ctaTitle = showPromo ? promoConfig?.ctaTitle : 'Update Zerion';

  return transitions((style) => (
    <animated.div
      className={showUpdateNudge ? styles.updateContainer : styles.container}
      style={style}
    >
      <div className={styles.glow} />
      {imgSrc ? <img src={imgSrc} alt="" className={styles.image} /> : null}
      <UnstyledButton
        className={`${styles.closeButton} ${
          imgSrc ? styles.closeButtonWithImage : styles.closeButtonNoImage
        }`}
        onClick={handleDismiss}
        aria-label="Dismiss"
      >
        <CloseIcon className={styles.closeIcon} />
      </UnstyledButton>
      <div className={styles.content}>
        <VStack gap={16}>
          <div className={imgSrc ? undefined : styles.titleRow}>
            <UIText kind="body/accent">{title}</UIText>
          </div>
          <VStack gap={8}>
            <Button
              kind="primary"
              size={36}
              onClick={handleCtaClick}
              style={{ width: '100%' }}
            >
              {ctaTitle}
            </Button>
            {showPromo ? (
              <TextLink to="/settings/whats-new" className="hover:underline">
                <HStack gap={2} alignItems="center" justifyContent="center">
                  <UIText kind="caption/accent" color="var(--neutral-800)">
                    Full Changelog
                  </UIText>
                  <ChevronRightIcon
                    style={{
                      width: 14,
                      height: 14,
                      color: 'var(--neutral-800)',
                      display: 'block',
                    }}
                  />
                </HStack>
              </TextLink>
            ) : null}
          </VStack>
        </VStack>
      </div>
    </animated.div>
  ));
}

export function PromoToaster() {
  return (
    <DelayedRender delay={500}>
      <PromoToasterInner />
    </DelayedRender>
  );
}
