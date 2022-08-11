import React, { useLayoutEffect } from 'react';
import { Content } from 'react-area';
import { toggleUrlBar } from '../URLBar/URLBar';

export function NavigationTitle({
  title,
  urlBar,
}: {
  title: React.ReactNode;
  urlBar?: 'none';
}) {
  useLayoutEffect(() => {
    if (urlBar === 'none') {
      toggleUrlBar(false);
    }
    return () => {
      toggleUrlBar(true);
    };
  }, [urlBar]);

  if (urlBar === 'none') {
    return null;
  }

  return <Content name="navigation-bar">{title}</Content>;
}
