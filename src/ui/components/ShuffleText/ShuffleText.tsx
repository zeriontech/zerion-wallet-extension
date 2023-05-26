import React from 'react';
import { useLayoutEffect, useRef } from 'react';

function randomChar() {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return chars.charAt(Math.floor(Math.random() * chars.length));
}

interface ShuffleController {
  cancel: () => void;
}
function shuffleText(
  targetElement: HTMLElement,
  targetText: string,
  duration = 2000
): ShuffleController {
  let currentText: string = targetElement.innerText;
  let currentTime = 0;
  let transitionTimerId: NodeJS.Timer | undefined;

  const updateText = (): void => {
    let newText = '';
    for (let i = 0; i < targetText.length; i++) {
      if (currentText[i] !== targetText[i]) {
        newText += randomChar();
      } else {
        newText += currentText[i];
      }
    }
    targetElement.innerText = newText;
    currentText = newText;
  };

  const initialShuffle = (): void => {
    let newText = '';
    for (let i = 0; i < currentText.length; i++) {
      newText += randomChar();
    }
    targetElement.innerText = newText;
  };

  // Initial shuffle
  const initialShuffleTimerId = setInterval(() => {
    initialShuffle();
  }, 50);

  // After half the duration, stop initial shuffle and start transition to target text
  setTimeout(() => {
    clearInterval(initialShuffleTimerId);

    console.log('setting interval');
    transitionTimerId = setInterval(() => {
      currentTime += 50;
      if (currentTime >= duration) {
        if (transitionTimerId !== undefined) {
          clearInterval(transitionTimerId);
        }
        targetElement.innerText = targetText;
      } else {
        updateText();
      }
    }, 50);
  }, duration / 2);

  // Returning an object with a cancel method to stop the animation
  return {
    cancel: () => {
      if (initialShuffleTimerId !== undefined) {
        clearInterval(initialShuffleTimerId);
      }
      if (transitionTimerId !== undefined) {
        clearInterval(transitionTimerId);
      }
      // targetElement.innerText = targetText; // Optional: restore the target text immediately
    },
  };
}

export function ShuffleText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const textRef = useRef(text);

  useLayoutEffect(() => {
    if (textRef.current === text || !ref.current || !text) {
      return;
    }
    const { cancel } = shuffleText(ref.current, text, 500);
    textRef.current = text;
    return cancel;
  }, [text]);

  return <span ref={ref}>{text}</span>;
}
