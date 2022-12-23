import React, { useLayoutEffect } from 'react';
import { Content } from 'react-area';
import { useNavigate } from 'react-router-dom';
import { BackButton, toggleUrlBar } from '../URLBar/URLBar';
import { WalletAvatar } from '../WalletAvatar';

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
      <Content name="navigation-bar-end">
        {address ? (
          <WalletAvatar
            active={false}
            address={address}
            size={32}
            borderRadius="4px"
          />
        ) : (
          <span />
        )}
      </Content>
    </>
  );
}
