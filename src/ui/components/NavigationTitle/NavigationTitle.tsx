import React, { useLayoutEffect } from 'react';
import { Content } from 'react-area';
import { useNavigate } from 'react-router-dom';
import { WalletIcon } from 'src/ui/ui-kit/WalletIcon';
import { BackButton, toggleUrlBar } from '../URLBar/URLBar';

export function NavigationTitle({
  title,
  urlBar,
  backTo,
  address,
}: {
  title: React.ReactNode;
  urlBar?: 'none';
  backTo?: string;
  address?: string | null;
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
      <Content name="navigation-bar-right-element">
        {address ? (
          <WalletIcon active={false} address={address} iconSize={32} />
        ) : (
          <span />
        )}
      </Content>
    </>
  );
}
