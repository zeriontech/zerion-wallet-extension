import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import { Surface } from 'src/ui/ui-kit/Surface';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { HStack } from 'src/ui/ui-kit/HStack';
import ZerionIcon from 'jsx:src/ui/assets/zerion-logo.svg';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import browser from 'webextension-polyfill';
import { walletPort } from 'src/ui/shared/channels';
import { FillView } from '../FillView';
import { useBodyStyle } from '../Background/Background';
import { WarningIcon } from '../WarningIcon';

export function PhishingWarningPage() {
  const [params] = useSearchParams();
  const rawUrl = params.get('url');
  const safeUrl = useMemo(
    () => (rawUrl ? prepareForHref(rawUrl) : null),
    [rawUrl]
  );
  const hostname = safeUrl ? safeUrl.hostname : null;

  useBodyStyle({
    backgroundColor: 'var(--negative-500)',
    ['--body-width' as string]: '100vw',
  });

  return (
    <FillView>
      <Surface
        style={{
          ['--surface-background-color' as string]: 'var(--always-black)',
          padding: '48px 24px 24px',
          width: 425,
          position: 'relative',
        }}
      >
        <WarningIcon
          kind="negative"
          size={64}
          glow={true}
          outlineStrokeWidth={10}
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translate(-32px, -80px)',
          }}
        />
        <VStack gap={16}>
          <UIText
            kind="headline/h1"
            color="var(--always-white)"
            style={{ justifySelf: 'center' }}
          >
            Malicious DApp
          </UIText>
          <div
            style={{
              borderRadius: 8,
              border: '1px solid var(--always-white)',
              overflow: 'hidden',
            }}
          >
            <UIText
              kind="headline/h3"
              color="var(--always-white)"
              style={{
                padding: 8,
                whiteSpace: 'nowrap',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {hostname}
            </UIText>
            <HStack
              gap={8}
              alignItems="center"
              justifyContent="center"
              style={{ backgroundColor: 'var(--always-white)', padding: 8 }}
            >
              <UIText kind="body/accent" color="var(--always-black)">
                Connection blocked by
              </UIText>
              <ZerionIcon
                style={{ color: 'var(--always-black)', width: 20, height: 20 }}
              />
              <UIText kind="body/accent" color="var(--always-black)">
                Zerion
              </UIText>
            </HStack>
          </div>
          <VStack gap={24}>
            <VStack gap={8}>
              <UIText kind="body/regular" color="var(--always-white)">
                Potential risks:
              </UIText>
              <UIText kind="body/regular" color="var(--always-white)">
                <ul style={{ marginBlock: 0, paddingLeft: 16 }}>
                  <li>Theft of recovery phrase or password</li>
                  <li>Phishing attacks</li>
                  <li>Fake tokens or scams</li>
                </ul>
              </UIText>
              <UIText kind="body/regular" color="var(--neutral-500)">
                If you understand the risks and want to proceed, you can{' '}
                <UnstyledAnchor
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  href={safeUrl?.toString()}
                  rel="noopenner norefferer"
                  onClick={() => {
                    if (safeUrl?.origin) {
                      walletPort.request('ignoreDappSecurityWarning', {
                        url: safeUrl.origin,
                      });
                    }
                  }}
                >
                  continue to the site
                </UnstyledAnchor>
                .
              </UIText>
            </VStack>
            <Button
              kind="primary"
              onClick={() => {
                browser.tabs.create({});
                window.close();
              }}
            >
              Back to Safety
            </Button>
          </VStack>
        </VStack>
      </Surface>
    </FillView>
  );
}
