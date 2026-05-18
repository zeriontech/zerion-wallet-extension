import React, { forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { LedgerIframe } from 'src/ui/hardware-wallet/LedgerIframe';
import { getRootDomNode } from 'src/ui/shared/getRootDomNode';
import { urlContext } from 'src/shared/UrlContext';
import * as s from './LedgerDialogWrapper.module.css';

/**
 * Always-mounted host for the Ledger iframe. The iframe stays mounted across
 * troubleshooting opens so the iframe-internal session (sessionId, listeners)
 * is preserved. When `open` is false, the host is visually hidden via
 * pointer-events + visibility while the iframe remains in the DOM tree.
 */
export const LedgerDialogWrapper = forwardRef<
  HTMLIFrameElement,
  {
    open: boolean;
    onClose: () => void;
  }
>(function LedgerDialogWrapper({ open, onClose }, ref) {
  return createPortal(
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            key="backdrop"
            className={s.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
        ) : null}
      </AnimatePresence>
      <div
        className={s.container}
        data-open={open ? 'true' : 'false'}
        aria-hidden={!open}
      >
        <LedgerIframe
          ref={ref}
          initialRoute="/signConnector"
          appSearchParams={new URLSearchParams({
            ecosystem: 'evm',
            windowType: urlContext.windowType,
            supportBluetooth: 'false',
          }).toString()}
          style={{ backgroundColor: 'transparent' }}
          // @ts-ignore
          allowtransparency="true"
          tabIndex={-1}
          height={200}
        />
      </div>
    </>,
    getRootDomNode()
  );
});
