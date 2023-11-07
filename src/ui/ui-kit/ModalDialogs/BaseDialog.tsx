import React, { useEffect, useRef, useState } from 'react';
import { invariant } from 'src/shared/invariant';

export interface BaseDialogProps
  extends React.DialogHTMLAttributes<HTMLDialogElement> {
  containerStyle?: React.CSSProperties;
  closeOnClickOutside?: boolean;
  render?: (open: boolean) => React.ReactNode;
  renderWhenOpen?: () => React.ReactNode;
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
      ...props
    }: BaseDialogProps,
    ref: React.Ref<HTMLDialogElement>
  ) => {
    const [open, setOpen] = useState(props.open ?? false);
    const dialogRef = useRef<HTMLDialogElement | null>(null);

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
      if (!closeOnClickOutside) {
        return;
      }
      const handler = (event: MouseEvent) => {
        if (ref && 'current' in ref && event.target === ref.current) {
          ref.current?.close();
        }
      };
      document.body.addEventListener('click', handler);
      return () => {
        document.body.removeEventListener('click', handler);
      };
    }, [closeOnClickOutside, ref]);
    return (
      <dialog
        ref={composeRefs(ref, dialogRef)}
        style={{
          overflow: 'visible',
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
          style={{
            height: '100%',
            overflow: 'auto',
            overscrollBehaviorY: 'contain',
            WebkitOverflowScrolling: 'touch',
            ...containerStyle,
          }}
        >
          {renderWhenOpen
            ? open
              ? renderWhenOpen()
              : null
            : render
            ? render(open)
            : children}
        </div>
      </dialog>
    );
  }
);
