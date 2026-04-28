import { useEffect, useRef } from 'react';
import { isHotkey } from 'src/modules/is-hotkey';
import { emitter } from 'src/ui/shared/events';

interface Props {
  combination: string;
  onKeyDown: (event: KeyboardEvent, combination: string) => void;
  disabled?: boolean;
}

const inputTagNames = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'OPTION']);

function isEditableElement(element: Element | null): boolean {
  if (!element) {
    return false;
  }
  if (inputTagNames.has(element.tagName)) {
    return true;
  }
  return element instanceof HTMLElement && element.isContentEditable;
}

export function KeyboardShortcut({
  combination,
  onKeyDown,
  disabled = false,
}: Props) {
  const handler = useRef(onKeyDown);
  useEffect(() => {
    handler.current = onKeyDown;
  }, [onKeyDown]);

  useEffect(() => {
    if (disabled) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      // do not activate single-letter keyboard shortcuts when user
      // is focused in a text field or another form control. Check both
      // event.target and document.activeElement — with portalled popovers
      // or virtual-focus widgets, event.target may not be the focused input.
      const target = event.target instanceof Element ? event.target : null;
      if (
        isEditableElement(target) ||
        isEditableElement(document.activeElement)
      ) {
        return;
      }
      if (isHotkey(combination, event)) {
        if (!handler.current) {
          return;
        }
        event.preventDefault();
        handler.current(event, combination);
        emitter.emit('hotkeydown', combination);
      }
    }
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [combination, disabled]);
  return null;
}
