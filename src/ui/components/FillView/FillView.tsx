import React from 'react';
import cx from 'classnames';
import { NAVIGATION_BAR_HEIGHT } from '../URLBar';
import * as s from './styles.module.css';

export function FillView({
  className,
  style,
  adjustForNavigationBar = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  adjustForNavigationBar?: boolean;
}) {
  return (
    <div
      className={cx(
        className,
        adjustForNavigationBar ? s.adjustForNavigationBar : null
      )}
      style={{
        ...style,
        // @ts-ignore
        ['--navigation-bar-height']: `${NAVIGATION_BAR_HEIGHT}px`,
        height: '100%',
        flexGrow: 1,
        display: 'grid',
        alignContent: 'center',
        justifyItems: 'center',
      }}
      {...props}
    />
  );
}
