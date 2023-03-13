import React from 'react';
import cx from 'classnames';
import AngleIcon from 'jsx:./angle.svg';
import * as styles from './styles.module.css';

export function SpeechBubble({
  text,
  className,
  ...props
}: React.HTMLProps<HTMLDivElement> & { text: React.ReactNode }) {
  return (
    <div {...props} className={cx(className, styles.speechBubble, styles.left)}>
      {text}
      <AngleIcon className={styles.angle} />
    </div>
  );
}
