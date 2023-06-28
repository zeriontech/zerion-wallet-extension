import React, { useEffect } from 'react';

export interface BaseDialogProps
  extends React.DialogHTMLAttributes<HTMLDialogElement> {
  containerStyle?: React.CSSProperties;
  closeOnClickOutside?: boolean;
}

export const BaseDialog = React.forwardRef(
  (
    {
      style,
      children,
      containerStyle,
      closeOnClickOutside = true,
      ...props
    }: BaseDialogProps,
    ref: React.Ref<HTMLDialogElement>
  ) => {
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
        ref={ref}
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
          {children}
        </div>
      </dialog>
    );
  }
);
