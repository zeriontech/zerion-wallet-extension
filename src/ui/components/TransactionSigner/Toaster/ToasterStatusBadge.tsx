import React from 'react';
import { motion } from 'motion/react';
import * as s from './styles.module.css';
import type { TerminalKind } from './useToasterSession';

export function ToasterStatusBadge({
  kind,
  reducedMotion,
}: {
  kind: TerminalKind;
  reducedMotion: boolean;
}) {
  const isSuccess = kind === 'success';
  return (
    <div
      className={`${s.statusBadge} ${
        isSuccess ? s.statusBadgeSuccess : s.statusBadgeFailed
      }`}
    >
      <motion.svg
        width={20}
        height={20}
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        {isSuccess ? (
          <motion.path
            d="M3.5 8.5l3 3 6-6"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={
              reducedMotion
                ? { duration: 0.1 }
                : { duration: 0.25, ease: [0.32, 0.72, 0, 1], delay: 0.15 }
            }
          />
        ) : (
          <>
            <motion.path
              d="M4 4l8 8"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              initial={reducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={
                reducedMotion
                  ? { duration: 0.1 }
                  : { duration: 0.2, ease: [0.32, 0.72, 0, 1], delay: 0.15 }
              }
            />
            <motion.path
              d="M12 4l-8 8"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              initial={reducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={
                reducedMotion
                  ? { duration: 0.1 }
                  : { duration: 0.2, ease: [0.32, 0.72, 0, 1], delay: 0.25 }
              }
            />
          </>
        )}
      </motion.svg>
    </div>
  );
}
