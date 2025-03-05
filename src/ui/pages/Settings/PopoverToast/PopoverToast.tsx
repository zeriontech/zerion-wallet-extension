import React, { useImperativeHandle, useRef, useState } from 'react';
import * as dialogStyles from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog/styles.module.css';

function supportsPopover(): boolean {
  // Recommended check from mdn: https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/popoverTargetElement#examples
  // eslint-disable-next-line no-prototype-builtins
  return HTMLElement.prototype.hasOwnProperty('popover');
}

export interface PopoverToastHandle {
  /** removes current toast instantly (without animation) */
  removeToast: () => void;
  /** hides toast with animation */
  hideToast: () => void;
  showToast: () => void;
}

function PopoverToastComponent(
  props: React.HTMLAttributes<HTMLDivElement>,
  ref: React.Ref<PopoverToastHandle>
) {
  const [popoverSupported] = useState(() => supportsPopover());
  const popoverRef = useRef<HTMLDivElement>(null);
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);

  const removeToast = () => {
    clearTimeout(timerIdRef.current ?? 0);
    popoverRef.current?.hidePopover();
  };
  const hideToast = () => {
    document.startViewTransition(() => popoverRef.current?.hidePopover());
  };
  const showToast = () => {
    document.startViewTransition(() => popoverRef.current?.showPopover());
    timerIdRef.current = setTimeout(hideToast, 3000);
  };

  useImperativeHandle(ref, () => ({ removeToast, hideToast, showToast }));

  if (!popoverSupported) {
    return null;
  }
  return (
    <div
      ref={popoverRef}
      className={dialogStyles.slideUp}
      // @ts-ignore https://caniuse.com/mdn-api_htmlelement_popover
      popover="manual"
      style={{
        backgroundColor: 'var(--black)',
        padding: '8px 12px',
        borderRadius: 1000,
        color: 'var(--white)',
        marginBottom: 0,
        bottom: 'calc(20px + var(--technical-panel-bottom-height, 0px))',
      }}
      {...props}
    />
  );
}

export const PopoverToast = React.forwardRef(PopoverToastComponent);
