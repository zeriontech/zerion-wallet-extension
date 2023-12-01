import { produce } from 'immer';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useState } from 'react';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';

export function useMnemonicInput({
  columns = 3,
  rows = 4,
  maxInputNumber = 24,
  setValue,
  showCleanedClipboardMessage,
}: {
  columns?: number;
  rows?: number;
  maxInputNumber?: number;
  setValue: Dispatch<SetStateAction<string[]>>;
  showCleanedClipboardMessage?: boolean;
}) {
  const [revealEnabled, setRevealEnabled] = useState(true);
  const [hoveredInput, setHoveredInput] = useState<number | null>(null);
  const [focusedInput, setFocusedInput] = useState<number | null>(null);
  const setHoveredInputDebounced = useDebouncedCallback(setHoveredInput, 150);

  const handleFocusedInput = useCallback((n: number | null) => {
    setRevealEnabled(true);
    setFocusedInput(n);
  }, []);

  const phraseMode = rows * columns;

  const handlePaste = useCallback(
    (index: number, value: string) => {
      const splitValue = value.trim().split(/\s+/);
      setRevealEnabled(false); // prevent first input from automatically revealing
      setValue((current) => {
        return produce(current, (draft) => {
          splitValue.forEach((item, i) => {
            if (i + index >= maxInputNumber) {
              return;
            }
            draft[index + i] = item;
          });
        });
      });
    },
    [setValue, maxInputNumber]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.code === 'Space' && index + 1 < phraseMode) {
        e.preventDefault();
        document.getElementById(`word-${index + 1}`)?.focus();
        (
          document.getElementById(`word-${index + 1}`) as HTMLInputElement
        )?.select();
      }
      if (e.code === 'Backspace' && !e.currentTarget.value?.length) {
        e.preventDefault();
        document.getElementById(`word-${index - 1}`)?.focus();
      }
      if (e.code === 'ArrowLeft' && e.currentTarget.selectionStart === 0) {
        e.preventDefault();
        document.getElementById(`word-${index - 1}`)?.focus();
      }
      if (
        e.code === 'ArrowRight' &&
        index + 1 < phraseMode &&
        (e.currentTarget.selectionStart || 0) >=
          (e.currentTarget.value?.length || 0)
      ) {
        e.preventDefault();
        document.getElementById(`word-${index + 1}`)?.focus();
        (
          document.getElementById(`word-${index + 1}`) as HTMLInputElement
        )?.setSelectionRange(0, 0);
      }
      if (e.code === 'ArrowUp') {
        e.preventDefault();
        document.getElementById(`word-${index - 3}`)?.focus();
      }
      if (e.code === 'ArrowDown' && index + 3 < phraseMode) {
        e.preventDefault();
        document.getElementById(`word-${index + 3}`)?.focus();
      }
    },
    [phraseMode]
  );

  return {
    getInputProps: (index: number) => ({
      type:
        showCleanedClipboardMessage ||
        (revealEnabled && (hoveredInput === index || focusedInput === index))
          ? 'text'
          : 'password',
      required: index < phraseMode,
      disabled: index >= phraseMode,
      onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) =>
        handleKeyDown(e, index),
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setValue((current) => {
          return produce(current, (draft) => {
            draft[index] = e.target.value;
          });
        }),
      onFocus: () => handleFocusedInput(index),
      onBlur: () => handleFocusedInput(null),
      onMouseEnter: () => setHoveredInputDebounced(index),
      onMouseLeave: () => setHoveredInputDebounced(null),
      onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const value = e.clipboardData.getData('text/plain');
        handlePaste(index, value);
      },
      autoFocus: index === 0,
    }),
  };
}
