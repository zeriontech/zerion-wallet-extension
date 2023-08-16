import React from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { invariant } from 'src/shared/invariant';
import { FillView } from 'src/ui/components/FillView';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

function FishingBanner() {
  return (
    <FillView>
      <HStack
        gap={24}
        justifyContent="space-between"
        alignItems="center"
        style={{
          maxHeight: 900,
          gridTemplateColumns: '1fr auto',
        }}
      >
        <VStack gap={0}>
          <UIText kind="body/accent" color="#fff">
            Warning: Potential Threats
          </UIText>
          <UIText kind="body/regular" color="#fff">
            This DApp may be unsafe. Leave immediately to protect your assets.
          </UIText>
        </VStack>
        <Button
          kind="neutral"
          size={32}
          style={{ width: 120 }}
          onClick={() => {
            document.location = 'about:blank';
          }}
        >
          <UIText kind="caption/accent" color="#2962EF">
            Exit dApp
          </UIText>
        </Button>
      </HStack>
    </FillView>
  );
}

let reactRoot: Root | null = null;

function renderBanner(rootId: string) {
  const root = document.getElementById(rootId);
  invariant(root, 'root element should exist');

  if (reactRoot) {
    reactRoot.unmount();
  }
  reactRoot = createRoot(root);
  reactRoot.render(
    <React.StrictMode>
      <FishingBanner />
    </React.StrictMode>
  );
}

const ELEMENT_ID = 'zerion-fishing-banner-id';
const BANNER_HEIGHT =
  window.innerWidth > 900 ? 56 : window.innerWidth > 720 ? 72 : 108;

document.documentElement.style.transform = `translateY(${BANNER_HEIGHT}px)`;
const rootElement = document.createElement('div');
rootElement.id = ELEMENT_ID;
rootElement.style.position = 'fixed';
rootElement.style.top = `${BANNER_HEIGHT * -1}px`;
rootElement.style.left = '0';
rootElement.style.right = '0';
rootElement.style.height = `${BANNER_HEIGHT}px`;
rootElement.style.zIndex = '1000000000';
rootElement.style.padding = '8px 24px';
rootElement.style.backgroundColor = '#ff4a4a';
document.body.appendChild(rootElement);
renderBanner(ELEMENT_ID);
