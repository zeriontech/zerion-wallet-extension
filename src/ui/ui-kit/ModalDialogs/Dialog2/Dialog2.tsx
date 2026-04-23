import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Dialog as AriaDialog, DialogDismiss } from '@ariakit/react';
import { AnimatePresence, motion } from 'motion/react';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { getRootDomNode } from 'src/ui/shared/getRootDomNode';
import * as styles from './styles.module.css';

const NARROW_BREAKPOINT = 500;

/** ease-out-quart: fast start, gentle settle — ideal for elements entering */
function useIsNarrow() {
  const [isNarrow, setIsNarrow] = React.useState(
    () => window.innerWidth < NARROW_BREAKPOINT
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${NARROW_BREAKPOINT - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsNarrow(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isNarrow;
}

export function Dialog2({
  open,
  onClose,
  title,
  children,
  size = 'full',
  autoFocusInput = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /**
   * 'full' — dialog fills available space (full screen on narrow, 70vh centered).
   * 'content' — dialog sizes to its content height.
   */
  size?: 'full' | 'content';
  /** When false, the dialog won't auto-focus the first text input on open. */
  autoFocusInput?: boolean;
}) {
  const isNarrow = useIsNarrow();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Focus the first input after ariakit's Dialog has finished its own focus setup
  useEffect(() => {
    if (!open || !autoFocusInput) {
      return;
    }
    const raf = requestAnimationFrame(() => {
      const input = contentRef.current?.querySelector<HTMLElement>(
        'input[role="combobox"], input[type="text"], input:not([type])'
      );
      input?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [open, autoFocusInput]);

  const isFullscreen = isNarrow && size === 'full';

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          {/* Backdrop: shown whenever the dialog doesn't cover the whole screen */}
          {!isFullscreen ? (
            <motion.div
              className={styles.backdrop}
              // style={{ backdropFilter }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />
          ) : null}
          <AriaDialog
            open={open}
            onClose={onClose}
            render={
              <motion.div
                className={`${styles.dialog} ${
                  isNarrow ? styles.dialogFullscreen : styles.dialogCentered
                } ${size === 'content' ? styles.dialogContentHeight : ''}`}
                initial={
                  isNarrow
                    ? {
                        transform: 'translateY(32px) scale(0.98)',
                        opacity: 0,
                        filter: 'blur(4px)',
                      }
                    : size === 'content'
                    ? {
                        transform:
                          'translate(-50%, calc(-50% + 24px)) scale(0.96)',
                        opacity: 0,
                        filter: 'blur(4px)',
                      }
                    : {
                        transform: 'translate(-50%, 24px) scale(0.96)',
                        opacity: 0,
                        filter: 'blur(4px)',
                      }
                }
                animate={{
                  transform: isNarrow
                    ? 'translateY(0px) scale(1)'
                    : size === 'content'
                    ? 'translate(-50%, -50%) scale(1)'
                    : 'translate(-50%, 0px) scale(1)',
                  opacity: 1,
                  filter: 'blur(0px)',
                }}
                exit={
                  isNarrow
                    ? {
                        transform: 'translateY(32px) scale(0.98)',
                        opacity: 0,
                        filter: 'blur(4px)',
                      }
                    : size === 'content'
                    ? {
                        transform:
                          'translate(-50%, calc(-50% + 24px)) scale(0.96)',
                        opacity: 0,
                        filter: 'blur(4px)',
                      }
                    : {
                        transform: 'translate(-50%, 24px) scale(0.96)',
                        opacity: 0,
                        filter: 'blur(4px)',
                      }
                }
                transition={{ duration: 0.2 }}
              />
            }
            portal={false}
            hideOnEscape={false}
            autoFocusOnShow={false}
          >
            <div className={styles.header}>
              <UIText kind="headline/h3">{title}</UIText>
              <DialogDismiss className={styles.closeButton}>
                <CloseIcon style={{ width: 20, height: 20 }} />
              </DialogDismiss>
            </div>
            <div ref={contentRef} className={styles.content}>
              {children}
            </div>
          </AriaDialog>
        </>
      ) : null}
    </AnimatePresence>,
    getRootDomNode()
  );
}
