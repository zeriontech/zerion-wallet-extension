import React from 'react';
import cn from 'classnames';
import * as styles from './styles.module.css';

export const StickyBottomPanel = React.forwardRef(
  (
    {
      className,
      containerStyle,
      backdropStyle,
      children,
      ...props
    }: React.HTMLProps<HTMLDivElement> & {
      containerStyle?: React.CSSProperties;
      backdropStyle?: React.CSSProperties;
    },
    ref: React.Ref<HTMLDivElement>
  ) => {
    return (
      <div className={styles.stickyBottomSheet} style={containerStyle}>
        <div className={styles.backdrop} style={backdropStyle} />
        <div ref={ref} className={cn(className, styles.content)} {...props}>
          {children}
        </div>
      </div>
    );
  }
);
