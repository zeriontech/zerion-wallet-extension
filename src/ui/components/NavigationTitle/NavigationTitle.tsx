import React, { useLayoutEffect } from 'react';
import { Content } from 'react-area';
import { useNavigate } from 'react-router-dom';
import { BackButton, toggleUrlBar } from '../URLBar/URLBar';

export function NavigationTitle({
  title,
  urlBar,
  backTo,
}: {
  title: React.ReactNode;
  urlBar?: 'none';
  backTo?: string;
}) {
  const navigate = useNavigate();
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

  return (
    <>
      {backTo ? (
        <Content name="navigation-bar-back-button">
          <BackButton onClick={() => navigate(backTo)} />
        </Content>
      ) : null}
      <Content name="navigation-bar">{title}</Content>
    </>
  );
}
