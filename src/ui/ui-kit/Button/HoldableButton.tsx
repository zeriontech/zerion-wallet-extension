import {
  useCallback,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ElementType,
} from 'react';
import React from 'react';
import cn from 'classnames';
import { UIText } from '../UIText';
import { borderRadius, kinds, type Kind, type Size } from './Button';
import * as buttonStyles from './styles.module.css';
import * as styles from './holdableStyles.module.css';

interface Props {
  kind?: Kind;
  size?: Size;
  holdColor?: string;
  successColor?: string;
  errorColor?: string;
  text: React.ReactNode;
  submittingText?: React.ReactNode;
  successText?: React.ReactNode;
  errorText?: React.ReactNode;
  holdDuration?: number;
  submitting?: boolean;
  success?: boolean;
  error?: boolean;
  holdHint?: React.ReactNode;
}

type State = 'idle' | 'hold' | 'submitting' | 'success' | 'error';

const ACTIVE_BACKGROUND_COLOR: Record<Kind, string> = {
  primary: 'var(--neutral-800)',
  danger: 'var(--negative-300)',
  warning: 'var(--notice-300)',
  // same neutral color for the rest of kinds
  ghost: 'var(--neutral-200)',
  neutral: 'var(--neutral-200)',
  regular: 'var(--neutral-200)',
  'loading-border': 'var(--neutral-200)',
  'text-primary': 'var(--neutral-200)',
};

const SHORT_PRESS_DURATION = 200;
const HINT_SHOW_DURATION = 1500;
const HINT_SHOW_MIN_BREAK = 2000;
const HOLD_DURATION_MARGIN = 100;

export const HoldableButton = <As extends ElementType = 'button'>({
  ref,
  style,
  as,
  kind = 'primary',
  size = 44,
  children,
  className,
  onClick,
  holdColor,
  successColor,
  errorColor,
  text,
  submittingText = 'Submitting...',
  successText = 'Success',
  errorText = 'Something was wrong',
  holdDuration = 1000,
  submitting,
  success,
  error,
  holdHint = 'Please press and hold the button',
  ...props
}: Props & { as?: As } & Omit<ComponentPropsWithRef<As>, 'kind' | 'as'>) => {
  const realButtonRef = useRef<HTMLButtonElement | null>(null);
  const [innerState, setInnerState] = useState<'idle' | 'hold' | 'submitting'>(
    'idle'
  );
  const [showHint, setShowHint] = useState(false);

  const state: State = submitting
    ? 'submitting'
    : success
    ? 'success'
    : error
    ? 'error'
    : innerState;
  const holdTimerRef = useRef<number | ReturnType<typeof setTimeout>>(0);
  const holdDurationCounter = useRef<number>(0);
  const lastDisplayHintTime = useRef<number>(0);
  const shortHoldCounter = useRef<number>(0);

  const displayHint = useCallback(() => {
    lastDisplayHintTime.current = Date.now();
    shortHoldCounter.current = 0;
    setShowHint(true);
    setTimeout(() => setShowHint(false), HINT_SHOW_DURATION);
  }, []);

  const handleMouseDown = useCallback(() => {
    setInnerState('hold');
    holdDurationCounter.current = Date.now();
    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      realButtonRef.current?.click();
    }, holdDuration + HOLD_DURATION_MARGIN);
  }, [holdDuration]);

  const handleMouseUp = useCallback(() => {
    if (Date.now() - holdDurationCounter.current < SHORT_PRESS_DURATION) {
      shortHoldCounter.current += 1;
    }
    if (
      shortHoldCounter.current > 2 &&
      Date.now() - lastDisplayHintTime.current > HINT_SHOW_MIN_BREAK
    ) {
      displayHint();
    }

    clearTimeout(holdTimerRef.current);
    setInnerState('idle');
  }, [displayHint]);

  const isButton = as == null || as === 'button';

  return (
    <>
      <UIText
        as={as || 'button'}
        type="button"
        ref={ref}
        kind="small/accent"
        className={cn(
          className,
          buttonStyles[kind],
          buttonStyles.button,
          styles.button,
          {
            [buttonStyles.asButton]: !isButton,
            [styles.hold]: state === 'hold',
            [styles.submitting]: state === 'submitting',
            [styles.success]: state === 'success',
            [styles.error]: state === 'error',
          }
        )}
        onMouseDown={(e) => {
          if (e.button === 0) {
            e.preventDefault();
            handleMouseDown();
          }
        }}
        onMouseUp={handleMouseUp}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (innerState === 'idle') {
              handleMouseDown();
            }
          }
        }}
        onKeyUp={handleMouseUp}
        onClick={(e) => {
          e.preventDefault();
        }}
        style={Object.assign(
          {
            border: 'none',
            textDecoration: 'none',
            borderRadius: borderRadius[size],
            height: size,
            color: undefined,
            ['--button-background-hover' as string]:
              kind === 'primary' ? 'var(--black)' : undefined,
          },
          kinds[kind](size),
          style
        )}
      >
        <div
          className={cn(styles.background, styles.holdBackground)}
          style={{
            ['--hold-duration' as string]: `${holdDuration}ms`,
            backgroundColor: holdColor || ACTIVE_BACKGROUND_COLOR[kind],
          }}
        />
        <div
          className={cn(styles.background, styles.successBackground)}
          style={{
            backgroundColor: successColor || ACTIVE_BACKGROUND_COLOR[kind],
          }}
        />
        <div
          className={cn(styles.background, styles.errorBackground)}
          style={{
            backgroundColor: errorColor || ACTIVE_BACKGROUND_COLOR[kind],
          }}
        />
        <div className={cn(styles.content, styles.text)}>{text}</div>
        <div className={cn(styles.content, styles.submittingText)}>
          {submittingText}
        </div>
        <div className={cn(styles.content, styles.successText)}>
          {successText}
        </div>
        <div className={cn(styles.content, styles.errorText)}>{errorText}</div>
      </UIText>
      <button
        ref={realButtonRef}
        onClick={onClick}
        className={styles.hiddenButton}
        tabIndex={-1}
        {...props}
      />
      {showHint && holdHint ? (
        <div className={styles.holdHintContainer}>
          <UIText
            kind="caption/accent"
            color="var(--always-white)"
            className={styles.holdHint}
          >
            {holdHint}
          </UIText>
        </div>
      ) : null}
    </>
  );
};
