import React, { useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import LinkIcon from 'jsx:src/ui/assets/new-window.svg';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import * as s from './styles.module.css';
import type { ToasterTarget } from './useToasterTarget';

const ICON_SIZE = 20;

// Fade in from a blur while sliding in from the left, so the buttons feel like
// they emerge from under the text as the pill widens to make room for them.
function enterAnimation(reducedMotion: boolean, index: number) {
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.1 },
    };
  }
  return {
    initial: { opacity: 0, x: -10, filter: 'blur(4px)' },
    animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
    exit: {
      opacity: 0,
      x: -10,
      filter: 'blur(4px)',
      // Leave immediately — the entrance delay below must not apply on the
      // way out.
      transition: { duration: 0.18, delay: 0 },
    },
    transition: {
      duration: 0.3,
      ease: [0.32, 0.72, 0, 1] as const,
      // The pill widens first; let it lead, and stagger the second button
      // behind the first.
      delay: 0.12 + index * 0.06,
    },
  };
}

/**
 * One circular action in the pill. Renders an anchor when it navigates
 * somewhere, a button otherwise. Both stop propagation: the pill itself is a
 * click target (History) and a drag handle.
 */
function ToasterAction({
  index,
  reducedMotion,
  label,
  href,
  onClick,
  children,
}: {
  index: number;
  reducedMotion: boolean;
  label: string;
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onClick?.();
    },
    [onClick]
  );
  const commonProps = {
    className: s.actionButton,
    'aria-label': label,
    title: label,
    onClick: handleClick,
    // Pointer-down would otherwise start a drag of the pill underneath.
    onPointerDown: (event: React.PointerEvent) => event.stopPropagation(),
    whileHover: reducedMotion ? undefined : { scale: 1.08 },
    whileTap: reducedMotion ? undefined : { scale: 0.94 },
    ...enterAnimation(reducedMotion, index),
  };
  return href ? (
    <motion.a
      {...commonProps}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </motion.a>
  ) : (
    <motion.button {...commonProps} type="button">
      {children}
    </motion.button>
  );
}

/**
 * Copy-hash and open-in-explorer actions shown on the right of the pill in the
 * success state. Each renders only when its target exists.
 */
export function ToasterActions({
  target,
  reducedMotion,
}: {
  target: ToasterTarget;
  reducedMotion: boolean;
}) {
  const { hash, explorerUrl } = target;
  const { handleCopy, isSuccess } = useCopyToClipboard({ text: hash ?? '' });

  const href = useMemo(
    () => (explorerUrl ? prepareForHref(explorerUrl)?.toString() : undefined),
    [explorerUrl]
  );

  if (!hash && !href) {
    return null;
  }

  return (
    <motion.div className={s.actions}>
      {hash ? (
        <ToasterAction
          index={0}
          reducedMotion={reducedMotion}
          label="Copy transaction hash"
          onClick={handleCopy}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={isSuccess ? 'copied' : 'copy'}
              className={s.actionIcon}
              style={isSuccess ? { color: 'var(--positive-500)' } : undefined}
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.6, filter: 'blur(4px)' }
              }
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.6, filter: 'blur(4px)' }
              }
              transition={
                reducedMotion ? { duration: 0.1 } : { duration: 0.18 }
              }
            >
              {isSuccess ? (
                <CheckIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
              ) : (
                <CopyIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
              )}
            </motion.span>
          </AnimatePresence>
        </ToasterAction>
      ) : null}
      {href ? (
        <ToasterAction
          index={hash ? 1 : 0}
          reducedMotion={reducedMotion}
          label="View in explorer"
          href={href}
        >
          <span className={s.actionIcon}>
            <LinkIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
          </span>
        </ToasterAction>
      ) : null}
    </motion.div>
  );
}
