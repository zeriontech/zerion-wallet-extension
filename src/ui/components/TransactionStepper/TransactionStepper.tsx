import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import * as s from './styles.module.css';

export type StepStatus =
  | 'waiting'
  | 'signing'
  | 'pending'
  | 'confirmed'
  | 'failed';

export interface Step {
  label: string;
  status: StepStatus;
}

function StepIndicator({
  status,
  index,
  isActive,
}: {
  status: StepStatus;
  index: number;
  isActive: boolean;
}) {
  return (
    <div className={s.stepIndicator}>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={status}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={s.stepIcon}
        >
          {status === 'confirmed' ? (
            <div className={`${s.stepCircle} ${s.stepCircleConfirmed}`}>
              <CheckIcon
                style={{ color: 'var(--always-white)', width: 14, height: 14 }}
              />
            </div>
          ) : status === 'failed' ? (
            <div className={s.failedDot} />
          ) : (
            <div
              className={`${s.stepCircle} ${
                isActive ? s.stepCircleActive : s.stepCircleFuture
              }`}
            >
              {index + 1}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function TransactionStepper({ steps }: { steps: Step[] }) {
  const activeIndex = steps.findIndex(
    (step) => step.status !== 'confirmed' && step.status !== 'failed'
  );
  return (
    <div className={s.stepper}>
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        return (
          <React.Fragment key={index}>
            <div className={s.step}>
              <StepIndicator
                status={step.status}
                index={index}
                isActive={isActive}
              />
              <span
                className={s.label}
                style={{
                  color:
                    step.status === 'confirmed'
                      ? 'var(--positive-500)'
                      : step.status === 'failed'
                      ? 'var(--negative-500)'
                      : isActive
                      ? 'var(--black)'
                      : 'var(--neutral-600)',
                }}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <span className={s.connector} aria-hidden="true">
                →
              </span>
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}
