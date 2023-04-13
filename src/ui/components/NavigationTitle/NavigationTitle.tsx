import React, { useLayoutEffect } from 'react';
import { Content } from 'react-area';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../BackButton';
import { toggleUrlBar } from '../URLBar/URLBar';

export function NavigationTitle({
  title,
  documentTitle,
  urlBar,
  backTo,
  elementEnd,
}: (
  | {
      title: string;
      documentTitle?: undefined;
    }
  | { title: React.ReactNode; documentTitle: string }
) & {
  urlBar?: 'none';
  backTo?: string;
  elementEnd?: React.ReactNode;
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

  const stringTitle = documentTitle ?? String(title);
  useLayoutEffect(() => {
    document.title = stringTitle;
  }, [stringTitle]);

  if (urlBar === 'none') {
    return null;
  }

  return (
    <>
      {backTo ? (
        <Content name="navigation-bar-back-button">
          <BackButton style={{ padding: 8 }} onClick={() => navigate(backTo)} />
        </Content>
      ) : null}
      <Content name="navigation-bar">{title}</Content>
      <Content name="navigation-bar-end">
        {elementEnd ? elementEnd : <span />}
      </Content>
    </>
  );
}
