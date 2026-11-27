import React, { useCallback, useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import Logo from 'jsx:src/ui/assets/zerion-full-logo.svg';
import CheckmarkIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import { PageLayout } from 'src/ui/features/onboarding/shared/PageLayout';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { SECURITY_CHECK_DOCUMENT_TITLE } from 'src/shared/cloudflareChallenge';
import { TurnstileFrame } from '../turnstile/TurnstileFrame';
import { notifyChallengeSolved } from '../turnstile/helpers';

const WIDGET_WIDTH = 300;
const WIDGET_HEIGHT = 88;
const RESULT_TIMEOUT_MS = 60 * 1000;
const CLOSE_COUNTDOWN_SECONDS = 3;

type Status = 'loading' | 'checking' | 'success' | 'error';

async function closeCurrentTab() {
  try {
    const tab = await browser.tabs.getCurrent();
    if (tab?.id != null) {
      await browser.tabs.remove(tab.id);
      return;
    }
  } catch {
    // Fall back to window.close() below.
  }
  window.close();
}

export function SecurityCheckPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [attempt, setAttempt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    document.title = SECURITY_CHECK_DOCUMENT_TITLE;
  }, []);

  useEffect(() => {
    if (status === 'success' || status === 'error') return;
    const timer = window.setTimeout(() => setStatus('error'), RESULT_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [status, attempt]);

  useEffect(() => {
    if (status !== 'success' || secondsLeft == null) return;
    if (secondsLeft <= 0) {
      void closeCurrentTab();
      return;
    }
    const timer = window.setTimeout(() => {
      setSecondsLeft((current) => (current == null ? null : current - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [status, secondsLeft]);

  const handleToken = useCallback(() => {
    setStatus((current) => (current === 'success' ? current : 'success'));
    setSecondsLeft((current) => current ?? CLOSE_COUNTDOWN_SECONDS);
    notifyChallengeSolved('page');
  }, []);

  const handleLoad = useCallback(() => {
    setStatus((current) => (current === 'loading' ? 'checking' : current));
  }, []);

  const handleRetry = useCallback(() => {
    setAttempt((current) => current + 1);
    setStatus('loading');
    setSecondsLeft(null);
  }, []);

  const showFrame = status === 'loading' || status === 'checking';

  return (
    <PageLayout>
      <div
        style={{
          minHeight: 'calc(100vh - 96px)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 480,
            padding: '40px 32px 28px',
            borderRadius: 20,
            backgroundColor: 'var(--white)',
            textAlign: 'center',
          }}
        >
          <Logo style={{ display: 'block', marginInline: 'auto' }} />
          <VStack gap={8} style={{ textAlign: 'center', marginTop: 24 }}>
            <UIText kind="headline/h2" color="var(--neutral-900)">
              Quick security check
            </UIText>
            <UIText kind="body/regular" color="var(--neutral-600)">
              Zerion needs to confirm it’s you before it can refresh your wallet in the background.
              This takes a few seconds.
            </UIText>
          </VStack>

          <div
            aria-live="polite"
            style={{
              minHeight: WIDGET_HEIGHT,
              display: 'grid',
              placeItems: 'center',
              marginTop: 24,
            }}
          >
            {status === 'success' ? (
              <VStack gap={12} style={{ justifyItems: 'center', textAlign: 'center' }}>
                <CheckmarkIcon
                  style={{ display: 'block', color: 'var(--positive-500)', width: 48, height: 48 }}
                />
                <UIText kind="body/accent" color="var(--neutral-900)">
                  You’re all set
                </UIText>
                {secondsLeft != null && secondsLeft > 0 ? (
                  <UIText kind="small/regular" color="var(--neutral-500)">
                    Closing in {secondsLeft}…
                  </UIText>
                ) : null}
              </VStack>
            ) : null}

            {status === 'error' ? (
              <VStack gap={16} style={{ justifyItems: 'center', textAlign: 'center' }}>
                <UIText kind="body/regular" color="var(--neutral-600)">
                  The check didn’t finish. Try again.
                </UIText>
                <Button kind="primary" size={40} onClick={handleRetry}>
                  Retry
                </Button>
              </VStack>
            ) : null}

            {showFrame ? (
              <div style={{ position: 'relative', width: WIDGET_WIDTH, height: WIDGET_HEIGHT }}>
                <TurnstileFrame
                  key={attempt}
                  onToken={handleToken}
                  onLoad={handleLoad}
                  onError={() => setStatus('error')}
                  width={WIDGET_WIDTH}
                  height={WIDGET_HEIGHT}
                  style={{ opacity: status === 'loading' ? 0 : 1 }}
                  autoFocus={true}
                />
                {status === 'loading' ? (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <CircleSpinner size="28px" color="var(--neutral-500)" />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <details style={{ marginTop: 24, textAlign: 'left' }}>
            <summary
              style={{
                cursor: 'pointer',
                color: 'var(--neutral-600)',
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              Why am I seeing this?
            </summary>
            <UIText
              kind="small/regular"
              color="var(--neutral-600)"
              style={{ marginTop: 8, display: 'block' }}
            >
              Zerion refreshes your wallet in the background. Cloudflare, the provider that protects
              Zerion’s API, occasionally asks for a quick human check before it allows those
              requests. Your keys and wallet stay on this device.
            </UIText>
          </details>
        </div>
      </div>
    </PageLayout>
  );
}
