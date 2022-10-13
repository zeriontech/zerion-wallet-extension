import React from 'react';
import cx from 'classnames';
import {
  zstack,
  hideLowerElements as hideLowerElementsClassName,
} from './styles.module.css';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  hideLowerElements?: boolean;
  alignItems?: React.CSSProperties['alignItems'];
  justifyContent?: React.CSSProperties['justifyContent'];
}

export function ZStack({
  hideLowerElements = false,
  className,
  alignItems,
  justifyContent,
  style,
  ...props
}: Props) {
  return (
    <div
      className={cx(zstack, className, {
        [hideLowerElementsClassName]: hideLowerElements,
      })}
      style={{
        alignItems,
        justifyContent,
        ...style,
      }}
      {...props}
    />
  );
}
