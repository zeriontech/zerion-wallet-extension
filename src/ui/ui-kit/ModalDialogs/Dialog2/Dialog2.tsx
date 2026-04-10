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
const EASE_OUT: [number, number, number, number] = [0.165, 0.84, 0.44, 1];

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
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
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
    if (!open) {
      return;
    }
    const raf = requestAnimationFrame(() => {
      const input = contentRef.current?.querySelector<HTMLElement>(
        'input[role="combobox"], input[type="text"], input:not([type])'
      );
      input?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          {/* Backdrop: only on wide screens with blur */}
          {!isNarrow ? (
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
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
                }`}
                initial={
                  isNarrow
                    ? {
                        transform: 'translateY(16px)',
                        opacity: 0,
                        filter: 'blur(4px)',
                      }
                    : {
                        opacity: 0,
                        scale: 0.96,
                        filter: 'blur(4px)',
                      }
                }
                animate={{
                  transform: isNarrow ? 'translateY(0px)' : undefined,
                  opacity: 1,
                  scale: isNarrow ? undefined : 1,
                  filter: 'blur(0px)',
                }}
                exit={
                  isNarrow
                    ? {
                        transform: 'translateY(16px)',
                        opacity: 0,
                        filter: 'blur(4px)',
                      }
                    : {
                        opacity: 0,
                        scale: 0.96,
                        filter: 'blur(4px)',
                      }
                }
                transition={{
                  duration: 0.25,
                  ease: EASE_OUT,
                }}
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
