import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
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
  const [overflows, setOverflows] = useState(false);

  const updateLayout = useCallback(() => {
    if (!containerRef.current || !wrapperRef.current) {
      return;
    }
    const availableHeight =
      window.innerHeight -
      wrapperRef.current.getBoundingClientRect().top -
      BUG_REPORT_BUTTON_HEIGHT;
    containerRef.current.style.height = `${availableHeight}px`;
    setOverflows(containerRef.current.scrollHeight > availableHeight);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', updateLayout);
    window.addEventListener('resize', updateLayout);
    return () => {
      window.removeEventListener('scroll', updateLayout);
      window.removeEventListener('resize', updateLayout);
    };
  }, [updateLayout]);

  useLayoutEffect(() => {
    updateLayout();
  }, [updateLayout]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const observer = new ResizeObserver(() => updateLayout());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [updateLayout]);

  return (
    <div
      ref={wrapperRef}
      className={adjustForNavigationBar ? s.adjustForNavigationBar : null}
      style={{
        ['--navigation-bar-height' as string]: `${NAVIGATION_BAR_HEIGHT}px`,
        maxHeight,
        flexGrow: 1,
        display: 'grid',
        ...wrapperStyle,
      }}
    >
      <div
        ref={containerRef}
        {...props}
        className={cx(className, s.hideScrollbar)}
        style={{
          display: 'grid',
          alignContent: overflows ? 'start' : 'center',
          justifyItems: 'center',
          position: 'relative',
          overflowY: 'auto',
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
}
