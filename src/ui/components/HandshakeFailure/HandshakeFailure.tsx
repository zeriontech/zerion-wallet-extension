import React, { useEffect } from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { VStack } from 'src/ui/ui-kit/VStack';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { FillView } from '../FillView';
import { hideURLBarFor } from '../URLBar/URLBar';

hideURLBarFor('/handshake-failure');

export function HandshakeFailure() {
  useEffect(() => {
    // Unregister serviceWorker on UI close. Currently, the only way
    // to get unstuck with the oudated SW
    let registration: ServiceWorkerRegistration | undefined = undefined;
    navigator.serviceWorker.getRegistration().then((r) => {
      registration = r;
    });
    const unregister = () => registration?.unregister();
    window.addEventListener('unload', unregister);
    return () => {
      window.removeEventListener('unload', unregister);
    };
  }, []);
  return (
    <FillView>
      <VStack gap={4} style={{ padding: 20, textAlign: 'center' }}>
        <span style={{ fontSize: 20 }}>💔</span>
        <UIText kind="body/regular">Background Script is not responding</UIText>
        <UIText kind="small/regular" color="var(--neutral-500)">
          Please, re-open the extension.
          <br />
          If this keeps happening, try refreshing the extension on{' '}
          <UnstyledAnchor
            href="chrome://extensions"
            // chrome://extensions is not allowed to be linked to, but
            // can be opened programmatically
            onClick={openInNewWindow}
            target="_blank"
            rel="noopener noreferrer"
            className={helperStyles.hoverNoUnderline}
          >
            extensions page
          </UnstyledAnchor>
        </UIText>
      </VStack>
    </FillView>
  );
}
