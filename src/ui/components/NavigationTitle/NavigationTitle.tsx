import React, { useLayoutEffect } from 'react';
import { Content } from 'react-area';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../BackButton';
import { toggleUrlBar } from '../URLBar/URLBar';

export function NavigationTitle({
  title,
  documentTitle,
  ignoreDocumentTitle_DO_NOT_USE_EXCEPT_FOR_LOADING_VIEW,
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
  ignoreDocumentTitle_DO_NOT_USE_EXCEPT_FOR_LOADING_VIEW?: boolean;
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
    if (ignoreDocumentTitle_DO_NOT_USE_EXCEPT_FOR_LOADING_VIEW) {
      return;
    }
    if (process.env.NODE_ENV !== 'production' && !stringTitle) {
      throw new Error(
        'NavigationTitle: either title or documentTitle is required'
      );
    }
    document.title = stringTitle;
  }, [ignoreDocumentTitle_DO_NOT_USE_EXCEPT_FOR_LOADING_VIEW, stringTitle]);

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
        {elementEnd ? elementEnd : <span />}
      </Content>
    </>
  );
}
