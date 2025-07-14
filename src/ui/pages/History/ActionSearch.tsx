import React, { useLayoutEffect, useRef, useState } from 'react';
import { registerPreview } from 'src/ui-lab/previews/registerPreview';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import type { InputProps } from 'src/ui/ui-kit/Input/Input';
import { SearchInput } from 'src/ui/ui-kit/Input/SearchInput';

const keyframesStyle = `
  .flaming-input-animated:focus-visible {
    outline-color: #ff4500;
    border-color: #ff4500;
  }

  .rainbowGradient {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3px;
    border-radius: 11px;
    background: linear-gradient(to right, #ff0022a6, #ff72007d, #ff0000cf);
    box-shadow: 0 0 20px rgb(255 0 0 / 85%);
    transition: background 200ms, box-shadow 200ms;
  }

  .fire-base {
    width: 60px;
    height: 90%;
    background: radial-gradient(circle at center, #ab2e00 30%, #ff4500, transparent);
    border-radius: 50%;
    animation: pulse 1s infinite alternate;
    filter: blur(3px);
    z-index: 0;
    margin-left: -31px;
    flex-shrink: 0;
    flex-grow: 1;
    border-top-left-radius: 90%;
    transform-origin: bottom center;
  }
  .fire-base:nth-child(3n) {
    animation-delay: -0.33s;
    border-top-left-radius: 0%;
    border-top-right-radius: 0%;
  }
  .fire-base:nth-child(2) {
    animation-delay: -0.5s;
  }
  .fire-base:nth-child(3) {
    animation-delay: -0.3s;
  }
  .fire-base:nth-child(4) {
    animation-delay: -1.3s;
  }
  .fire-base:nth-child(5) {
    animation-delay: -0.1s;
  }
  @keyframes pulse {
    0% {
      transform: scaleY(0.85) translateX(20px) translateY(4px);
      opacity: 0.7;
    }
    100% {
      transform: scaleY(1.05) scaleX(0.8);
      opacity: 1;
    }
  }

  @keyframes realPulse {
    0% {
      transform: scale(0.99);
    }
    100% {
      transform: scale(1.02);
    }
  }
`;

function FlamingInput({
  animated,
  idle,
  inputRef,
  ...props
}: InputProps & {
  animated: boolean;
  idle: boolean;
  inputRef?: React.ForwardedRef<HTMLInputElement>;
}) {
  return (
    <>
      <style>{keyframesStyle}</style>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        style={{ display: 'none' }}
      >
        <defs>
          <filter id="goo">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="10"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
      <div
        style={{
          position: 'relative',
          width: '100%',
          animation:
            animated && !idle ? 'realPulse 1s alternate infinite' : undefined,
        }}
      >
        <div
          style={{
            pointerEvents: 'none',
            opacity: animated ? 1 : 0,
            display: 'flex',
            transition: 'opacity 200ms, inset 200ms',
            position: 'absolute',
            inset: idle ? 4 : -4,
            filter: 'url(#goo)',
            paddingLeft: 22,
          }}
        >
          <div className="fire-base"></div>
          <div className="fire-base"></div>
          <div className="fire-base"></div>
          <div className="fire-base"></div>
          <div className="fire-base"></div>
          <div className="fire-base"></div>
          <div className="fire-base"></div>
        </div>
        <div
          className="rainbowGradient"
          style={{
            padding: 3,
            background: animated ? undefined : 'transparent',
            boxShadow: animated ? undefined : 'none',
            display: 'grid',
            justifyContent: 'stretch',
          }}
        >
          <SearchInput
            placeholder="todo"
            className={animated ? 'flaming-input-animated' : undefined}
            ref={inputRef}
            {...props}
          />
        </div>
      </div>
    </>
  );
}

function FlamingInputDemo() {
  const [on, setState] = useState(true);
  const [idle, setIdle] = useState(false);
  return (
    <div>
      <FlamingInput animated={on} idle={idle} />
      <br />
      <button onClick={() => setState((n) => !n)}>toggle</button>
      <br />
      <button onClick={() => setIdle((n) => !n)}>idle</button>
    </div>
  );
}
registerPreview({
  component: <FlamingInputDemo />,
});

export function ActionSearch({
  value,
  onFocus,
  onChange,
  llmEffects = false,
  llmEffectsIdle = false,
}: {
  value?: string;
  onFocus: React.FocusEventHandler<HTMLInputElement>;
  onChange(value: string): void;
  llmEffects?: boolean;
  llmEffectsIdle?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debouncedHandleChange = useDebouncedCallback(onChange, 1000);

  useLayoutEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = value || '';
    }
  }, [value]);

  return (
    <FlamingInput
      animated={llmEffects}
      idle={llmEffectsIdle}
      inputRef={inputRef}
      boxHeight={40}
      type="search"
      placeholder="Search"
      defaultValue={value}
      onFocus={onFocus}
      onChange={(event) => {
        debouncedHandleChange(event.currentTarget.value);
      }}
    />
  );
}
