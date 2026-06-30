import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Dialog as AriaDialog, DialogDismiss } from '@ariakit/react';
import { AnimatePresence, motion } from 'motion/react';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { getRootDomNode } from 'src/ui/shared/getRootDomNode';
import { useMeasure } from 'src/ui/shared/useMeasure';
import * as styles from './styles.module.css';

const NARROW_BREAKPOINT = 500;

// Tracks the open Dialog2 instances in the order they opened. Only the
// dialog at the top of the stack reacts to Escape, so nested dialogs close
// one layer at a time instead of dismissing every dialog at once.
const dialogStack: string[] = [];

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
  titleAlign = 'center',
  headerStyle,
  children,
  size = 'full',
  autoFocusInput = true,
  style,
  animateContentSize = false,
}: {
  open: boolean;
  onClose: () => void;
  /** When omitted, the header (title + close X) is not rendered and the dismiss affordance becomes the consumer's responsibility. A string is wrapped in the standard title UIText; a node is rendered as-is (e.g. to prefix the title with an icon). */
  title?: React.ReactNode;
  /** Title horizontal alignment within the header. Defaults to `center`. */
  titleAlign?: 'center' | 'start';
  /** Inline style applied to the header row (e.g. to tighten its padding). */
  headerStyle?: React.CSSProperties;
  children: React.ReactNode;
  /**
   * 'full' — dialog fills available space (full screen on narrow, 70vh centered).
   * 'content' — dialog sizes to its content height.
   */
  size?: 'full' | 'content';
  /** When false, the dialog won't auto-focus the first text input on open. */
  autoFocusInput?: boolean;
  /** Inline style applied to the outermost dialog surface (e.g. to override its background). */
  style?: React.CSSProperties;
  /** When true, the dialog smoothly animates its own size as the content's height changes. Use with `size="content"`. */
  animateContentSize?: boolean;
}) {
  const isNarrow = useIsNarrow();
  const contentRef = useRef<HTMLDivElement>(null);
  const instanceId = useId();
  const [measureRef, { height: measuredHeight }] = useMeasure<HTMLDivElement>();

  useEffect(() => {
    if (!open) {
      return;
    }
    dialogStack.push(instanceId);
    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // Only the topmost open dialog handles Escape, so nested dialogs
      // close one layer at a time.
      if (dialogStack[dialogStack.length - 1] !== instanceId) return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      const index = dialogStack.lastIndexOf(instanceId);
      if (index !== -1) dialogStack.splice(index, 1);
    };
  }, [open, onClose, instanceId]);

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
              transition={{ duration: size === 'content' ? 0.15 : 0.15 }}
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
                style={style}
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
                transition={{ duration: size === 'content' ? 0.15 : 0.15 }}
              />
            }
            portal={false}
            hideOnEscape={false}
            autoFocusOnShow={false}
          >
            {title == null ? null : (
              <div className={styles.header} style={headerStyle}>
                {typeof title === 'string' ? (
                  <UIText
                    kind="body/accent"
                    className={
                      titleAlign === 'start'
                        ? styles.headerTitleStart
                        : styles.headerTitle
                    }
                  >
                    {title}
                  </UIText>
                ) : (
                  <div
                    className={
                      titleAlign === 'start'
                        ? styles.headerTitleStart
                        : styles.headerTitle
                    }
                  >
                    {title}
                  </div>
                )}
                <DialogDismiss className={styles.closeButton}>
                  <CloseIcon style={{ width: 20, height: 20 }} />
                </DialogDismiss>
              </div>
            )}
            {animateContentSize ? (
              <motion.div
                ref={contentRef}
                className={styles.content}
                animate={{
                  height: measuredHeight > 0 ? measuredHeight : 'auto',
                }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div ref={measureRef}>{children}</div>
              </motion.div>
            ) : (
              <div ref={contentRef} className={styles.content}>
                {children}
              </div>
            )}
          </AriaDialog>
        </>
      ) : null}
    </AnimatePresence>,
    getRootDomNode()
  );
}
