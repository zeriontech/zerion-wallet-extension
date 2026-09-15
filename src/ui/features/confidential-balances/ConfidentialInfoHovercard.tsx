import React from 'react';
import {
  Hovercard,
  HovercardAnchor,
  HovercardHeading,
  useHovercardStore,
  type HovercardStoreProps,
} from '@ariakit/react';
import { getRootDomNode } from 'src/ui/shared/getRootDomNode';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { ConfidentialInfoAnimation } from './ConfidentialInfoAnimation';
import * as styles from './styles.module.css';

// Long enough that the card doesn't flash while the pointer crosses a row,
// short enough to feel like an answer to hovering the control.
const SHOW_TIMEOUT = 300;
const HIDE_TIMEOUT = 150;

/**
 * Explainer card shown on hover over the confidential-balances entry points
 * (the Confidential Balances panel and an encrypted amount's mask) — the same
 * card the web app shows, animation included.
 *
 * A hovercard rather than a tooltip: the content is a small card with an
 * animation stage and two lines of copy, and the user has to be able to move
 * the pointer into it. It never takes focus on show and it doesn't swallow
 * the click — the wrapped control still opens the Reveal Dialog, and the card
 * gets out of the way as soon as it does.
 */
export function ConfidentialInfoHovercard({
  children,
  placement = 'bottom-start',
  anchorStyle,
}: {
  children: React.ReactNode;
  placement?: HovercardStoreProps['placement'];
  /** Applied to the wrapper around `children` — it is the positioning anchor */
  anchorStyle?: React.CSSProperties;
}) {
  const store = useHovercardStore({
    placement,
    showTimeout: SHOW_TIMEOUT,
    hideTimeout: HIDE_TIMEOUT,
  });
  return (
    <>
      {/* The anchor renders an <a> by default, which would nest an anchor
          around the control's own button; it is also not focusable — the
          wrapped control is the tab stop */}
      <HovercardAnchor
        store={store}
        focusable={false}
        render={<div style={anchorStyle} />}
        // The click opens the Reveal Dialog; the explainer has done its job.
        // Capture phase: the mask stops the click from bubbling out of its row.
        onClickCapture={() => store.hide()}
      >
        {children}
      </HovercardAnchor>
      <Hovercard
        store={store}
        // Portalled to #root (not <body>, which is a grid) so the list's
        // overflow can't clip it; `fixed` so the wrapper adds no height
        // to the page and never scrolls it on open.
        portal={true}
        portalElement={getRootDomNode}
        fixed={true}
        unmountOnHide={true}
        fitViewport={true}
        autoFocusOnShow={false}
        gutter={8}
        overflowPadding={12}
        className={styles.infoCard}
      >
        <VStack gap={12}>
          <ConfidentialInfoAnimation />
          <VStack gap={4}>
            <HovercardHeading render={<UIText kind="body/accent" />}>
              Confidential Balances
            </HovercardHeading>
            <UIText kind="small/accent" color="var(--neutral-600)">
              Some tokens in this wallet are encrypted onchain, so nobody can
              see the amounts.
            </UIText>
          </VStack>
          <UIText kind="small/accent" color="var(--neutral-500)">
            Decrypt them with your wallet to reveal the amounts and count them
            in your total.
          </UIText>
        </VStack>
      </Hovercard>
    </>
  );
}
