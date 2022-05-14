import React from 'react';
import { Content } from 'react-area';

export function NavigationTitle({ title }: { title: React.ReactNode }) {
  return <Content name="navigation-bar">{title}</Content>;
}
