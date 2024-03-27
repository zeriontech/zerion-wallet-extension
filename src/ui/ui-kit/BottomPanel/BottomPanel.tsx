import React from 'react';
import cn from 'classnames';
import { useSpring, animated } from '@react-spring/web';
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
        <div ref={ref} className={cn(className, styles.content)} {...props}>
          {children}
        </div>
        <div
          className={styles.backdrop}
          style={{
            top: 24,
            bottom: -16,
            left: -16,
            right: -16,
            ...backdropStyle,
          }}
        />
      </div>
    );
  }
);

export const AnimatedBottomPanel = React.forwardRef(
  (
    {
      className,
      containerStyle,
      backdropStyle,
      style,
      children,
      animated: isAnimated,
      show,
      ...props
    }: React.HTMLProps<HTMLDivElement> & {
      containerStyle?: React.CSSProperties;
      backdropStyle?: React.CSSProperties;
      animated?: boolean;
      show?: boolean;
    },

    ref: React.Ref<HTMLDivElement>
  ) => {
    const contentStyle = useSpring({
      config: {
        tension: 180,
        friction: 18,
      },
      from: {
        y: 150,
      },
      to: {
        y: show ? 0 : 150,
      },
    });

    return (
      <div className={styles.fixedBottomSheet} style={containerStyle}>
        <animated.div style={{ ...contentStyle, zIndex: 2 }}>
          <div ref={ref} className={cn(className, styles.content)} {...props}>
            {children}
          </div>
        </animated.div>
        {show ? (
          <div
            className={styles.backdrop}
            style={{
              top: 24,
              left: 16,
              right: 16,
              bottom: -16,
              zIndex: -1,
              ...backdropStyle,
            }}
          />
        ) : null}
      </div>
    );
  }
);
