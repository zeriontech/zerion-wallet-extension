import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import cx from 'classnames';
import { NAVIGATION_BAR_HEIGHT } from '../URLBar';
import { BUG_REPORT_BUTTON_HEIGHT } from '../BugReportButton';
import * as s from './styles.module.css';

export const FillView = React.forwardRef(
  (
    {
      className,
      style,
      adjustForNavigationBar = false,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      adjustForNavigationBar?: boolean;
    },
    ref: React.Ref<HTMLDivElement>
  ) => {
    return (
      <div
        ref={ref}
        className={cx(
          className,
          adjustForNavigationBar ? s.adjustForNavigationBar : null
        )}
        style={{
          ['--navigation-bar-height' as string]: `${NAVIGATION_BAR_HEIGHT}px`,
          height: '100%',
          flexGrow: 1,
          display: 'grid',
          alignContent: 'center',
          justifyItems: 'center',
          ...style,
        }}
        {...props}
      />
    );
  }
);

export function CenteredFillViewportView({
  className,
  style,
  adjustForNavigationBar = false,
  children,
  maxHeight,
  wrapperStyle,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  adjustForNavigationBar?: boolean;
  maxHeight: React.CSSProperties['maxHeight'];
  wrapperStyle?: React.CSSProperties;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || !wrapperRef.current) {
      return;
    }
    const height =
      window.innerHeight - wrapperRef.current.getBoundingClientRect().top;
    containerRef.current.style.height = `${
      height - BUG_REPORT_BUTTON_HEIGHT
    }px`;
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      handleScroll();
    });
    const root = document.getElementById('root');
    if (root) {
      observer.observe(root);
    }
    return () => {
      observer.disconnect();
    };
  }, [handleScroll]);

  useLayoutEffect(() => {
    handleScroll();
  }, [handleScroll]);

  return (
    <div
      ref={wrapperRef}
      className={adjustForNavigationBar ? s.adjustForNavigationBar : null}
      style={{
        ['--navigation-bar-height' as string]: `${NAVIGATION_BAR_HEIGHT}px`,
        height: maxHeight,
        flexGrow: 1,
        display: 'grid',
        ...wrapperStyle,
      }}
    >
      <div
        ref={containerRef}
        {...props}
        style={{
          display: 'grid',
          alignContent: 'center',
          justifyItems: 'center',
          position: 'relative',
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
}
