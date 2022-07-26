import React from 'react';
import cx from 'classnames';
import {
  spinnerStyle,
  fillStyle,
  trackStyle,
  // trackColorProperty,
} from './styles.module.css';

export interface Props extends React.SVGAttributes<SVGElement> {
  size?: string;
  color?: string;
  trackWidth?: string;
  trackColor?: string;
}

export function CircleSpinner({
  size = '1em',
  color = 'currentColor',
  trackWidth = '10%',
  trackColor,
  className,
  style,
  ...props
}: Props) {
  return (
    <svg
      className={cx(spinnerStyle, className)}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style={{ ...style, color, ['--track-color' as any]: trackColor }}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      {...props}
    >
      <circle
        className={trackStyle}
        fill="none"
        strokeWidth={trackWidth}
        strokeLinecap="butt"
        cx="50%"
        cy="50%"
        r="45%"
      ></circle>
      <circle
        className={fillStyle}
        fill="none"
        strokeWidth={trackWidth}
        strokeLinecap="butt"
        cx="50%"
        cy="50%"
        r="45%"
      ></circle>
    </svg>
  );
}
