import React, {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { uiTextParams, type Kind } from 'src/ui/ui-kit/UIText';

const SYMBOL_GAP = 2;
const DEFAULT_KIND: Kind = 'headline/h3';
const SHRUNK_KIND: Kind = 'caption/accent';

const symbolVariants = {
  initial: { y: 6, filter: 'blur(2px)', opacity: 0 },
  animate: { y: 0, filter: 'blur(0px)', opacity: 1 },
  exit: { y: -6, filter: 'blur(2px)', opacity: 0 },
};

interface Size {
  width: number;
  height: number;
}

const ZERO: Size = { width: 0, height: 0 };

// Inline adaptation of react-use-measure (https://github.com/pmndrs/react-use-measure).
// The ref is a state setter so changing the underlying DOM node deterministically
// re-runs the layout effect — no manual ref bookkeeping, no race between
// callback-ref invocations and observer setup. The effect reads
// getBoundingClientRect() synchronously on mount (so the first paint has the
// correct size) and then on every ResizeObserver tick.
export function useMeasure<T extends HTMLElement>(): [
  (node: T | null) => void,
  Size
] {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState<Size>(ZERO);

  useLayoutEffect(() => {
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setSize((prev) =>
        prev.width === rect.width && prev.height === rect.height
          ? prev
          : { width: rect.width, height: rect.height }
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return [setElement, size];
}

function getKindStyle(kind: Kind): CSSProperties {
  const [fontSize, lineHeight, fontWeight, letterSpacing] = uiTextParams[kind];
  return {
    fontSize,
    lineHeight: `${lineHeight}px`,
    fontWeight,
    letterSpacing,
  };
}

export function useValueScaling({
  text,
  containerWidth,
}: {
  text: string;
  containerWidth: number;
}) {
  const defaultMirrorRef = useRef<HTMLSpanElement | null>(null);
  const shrunkMirrorRef = useRef<HTMLSpanElement | null>(null);
  const [defaultWidth, setDefaultWidth] = useState(0);
  const [shrunkWidth, setShrunkWidth] = useState(0);

  useLayoutEffect(() => {
    if (defaultMirrorRef.current) {
      const w = defaultMirrorRef.current.getBoundingClientRect().width;
      setDefaultWidth((prev) => (prev === w ? prev : w));
    }
    if (shrunkMirrorRef.current) {
      const w = shrunkMirrorRef.current.getBoundingClientRect().width;
      setShrunkWidth((prev) => (prev === w ? prev : w));
    }
  }, [text]);

  const shouldShrink = containerWidth > 0 && defaultWidth > containerWidth;
  const activeKind: Kind = shouldShrink ? SHRUNK_KIND : DEFAULT_KIND;
  const textWidth = shouldShrink ? shrunkWidth : defaultWidth;

  return { defaultMirrorRef, shrunkMirrorRef, textWidth, activeKind };
}

/**
 * Renders an absolutely-positioned currency symbol that hugs the leftmost digit
 * of a right-aligned value. Animates in/out when `currencySymbol` changes.
 */
export function CurrencySymbolOverlay({
  currencySymbol,
  textWidth,
  color,
  style,
}: {
  currencySymbol: string | null;
  textWidth: number;
  /** When omitted, inherits parent color via `currentColor`. */
  color?: string;
  style?: CSSProperties;
}) {
  const right = textWidth + SYMBOL_GAP;
  return (
    <AnimatePresence initial={false} mode="popLayout">
      {currencySymbol ? (
        <motion.div
          key="symbol"
          aria-hidden
          variants={symbolVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right,
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
            color: color ?? 'currentColor',
            ...style,
          }}
        >
          {currencySymbol}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

const baseMirrorStyle: CSSProperties = {
  position: 'absolute',
  visibility: 'hidden',
  whiteSpace: 'pre',
  pointerEvents: 'none',
  left: 0,
  top: 0,
};

export function HiddenMirror({
  children,
  mirrorRef,
  kind,
}: {
  children: ReactNode;
  mirrorRef: React.MutableRefObject<HTMLSpanElement | null>;
  kind?: Kind;
}) {
  return (
    <span
      ref={mirrorRef}
      aria-hidden
      style={
        kind ? { ...baseMirrorStyle, ...getKindStyle(kind) } : baseMirrorStyle
      }
    >
      {children}
    </span>
  );
}
