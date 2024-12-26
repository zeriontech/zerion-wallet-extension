import React, { useEffect, useRef, useState, useCallback } from 'react';
import { invariant } from 'src/shared/invariant';
import { UIContext, defaultUIContextValue } from 'src/ui/components/UIContext';

export interface BaseDialogProps
  extends React.DialogHTMLAttributes<HTMLDialogElement> {
  containerStyle?: React.CSSProperties;
  closeOnClickOutside?: boolean;
  render?: (open: boolean) => React.ReactNode;
  renderWhenOpen?: () => React.ReactNode;
  /** Called AFTER the dialog had been actually closed. Can't be used for closing */
  onClosed?: () => void;
}

function setRef<T>(ref: React.Ref<T>, value: T) {
  if (ref && 'current' in ref) {
    (ref as React.MutableRefObject<T>).current = value;
  } else if (typeof ref === 'function') {
    ref(value);
  }
}

function composeRefs<T>(ref1: React.Ref<T>, ref2: React.Ref<T>) {
  return (node: T) => {
    setRef(ref1, node);
    setRef(ref2, node);
  };
}

export const BaseDialog = React.forwardRef(
  (
    {
      style,
      children,
      containerStyle,
      closeOnClickOutside = true,
      render,
      renderWhenOpen,
      onClosed,
      ...props
    }: BaseDialogProps,
    ref: React.Ref<HTMLDialogElement>
  ) => {
    const [open, setOpen] = useState(props.open ?? false);
    const dialogRef = useRef<HTMLDialogElement | null>(null);
    const onClosedRef = useRef(onClosed);
    if (onClosedRef.current !== onClosed) {
      onClosedRef.current = onClosed;
    }

    const [uiContextValue, setUIContextValue] = useState(defaultUIContextValue);

    useEffect(() => {
      invariant(dialogRef.current, 'Dialog not mounted');

      const handleOpen = () => setOpen(true);
      const handleClose = () => setOpen(false);

      const element = dialogRef.current;
      const observer = new MutationObserver((mutationList) => {
        for (const mutation of mutationList) {
          if (mutation.type === 'attributes') {
            if ((mutation.target as HTMLDialogElement).open) {
              handleOpen();
            }
          }
        }
      });
      observer.observe(element, {
        attributes: true,
        attributeFilter: ['open'],
      });
      element.addEventListener('close', handleClose);
      return () => {
        element.removeEventListener('close', handleClose);
        observer.disconnect();
      };
    }, []);

    useEffect(() => {
      const dialogEl = dialogRef.current;
      if (dialogEl) {
        const onClosed = () => onClosedRef.current?.();
        dialogEl.addEventListener('close', onClosed);
        return () => dialogEl.removeEventListener('close', onClosed);
      }
    }, []);

    useEffect(() => {
      if (!closeOnClickOutside) {
        return;
      }
      const handler = (event: MouseEvent) => {
        if (event.target === dialogRef.current) {
          if (dialogRef.current) {
            dialogRef.current.returnValue = '';
            dialogRef.current.close();
          }
        }
      };
      document.body.addEventListener('click', handler);
      return () => {
        document.body.removeEventListener('click', handler);
      };
    }, [closeOnClickOutside, ref]);
    return (
      <dialog
        // "useCallback" deps are statically unknown, but only "ref" is potentially unstable
        ref={useCallback(composeRefs(ref, dialogRef), [ref])}
        style={{
          overflow: 'visible', // TODO: why not "auto"? Is it for some "click outside" edge case?
          backgroundColor: 'transparent',
          ...style,
        }}
        {...props}
      >
        {/**
         * To detect "click outside", there aren't many options with a native <dialog> element.
         * Clicking on both <dialog> and its ::backdrop invokes an event
         * with event.target pointing to the <dialog> element.
         * To solve this, we add a container <div> inside the dialog which must be
         * the same size as the <dialog> element.
         * Then, if event.target of a click points to the <dialog> (and not the inner <div>)
         * we can interpret this as an outside click.
         */}
        <div
          ref={useCallback((node: HTMLDivElement | null) => {
            setUIContextValue(
              node ? { uiScrollRootElement: node } : defaultUIContextValue
            );
          }, [])}
          style={{
            height: '100%',
            overflow: 'auto',
            overscrollBehaviorY: 'contain',
            WebkitOverflowScrolling: 'touch',
            ...containerStyle,
          }}
        >
          <UIContext.Provider value={uiContextValue}>
            {renderWhenOpen
              ? open
                ? renderWhenOpen()
                : null
              : render
              ? render(open)
              : children}
          </UIContext.Provider>
        </div>
      </dialog>
    );
  }
);
