import React from 'react';
import * as s from './styles.module.css';

export function Twinkle({ children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={s.twinkle}>{children}</div>;
}
