import React, { useContext, useEffect, useState } from 'react';
import { PageColumn } from '../PageColumn';
import { PageFullBleedLine } from '../PageFullBleedLine';
import { UIContext } from '../UIContext';

function canBeScrolled(node: HTMLElement) {
  return node.scrollHeight > node.clientHeight;
}

export function PageStickyFooter({
  children,
  style,
}: React.HTMLAttributes<HTMLDivElement>) {
  const { uiScrollRootElement } = useContext(UIContext);
  const [drawTopBorder, setDrawTopBorder] = useState(
    canBeScrolled(uiScrollRootElement)
  );
  useEffect(() => {
    // uiScrollRootElement might have mutation before useEffect is run,
    // so we try to update state here before adding the MutationObserver
    setDrawTopBorder(canBeScrolled(uiScrollRootElement));

    function handler() {
      setDrawTopBorder(canBeScrolled(uiScrollRootElement));
    }
    const observer = new MutationObserver(handler);
    observer.observe(uiScrollRootElement, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    return () => {
      observer.disconnect();
    };
  }, [uiScrollRootElement]);

  return (
    <PageColumn
      style={{
        flexGrow: 0,
        position: 'sticky',
        bottom: 0,
        backgroundColor: 'var(--background)',
        ...style,
      }}
    >
      <PageFullBleedLine
        lineColor={drawTopBorder ? undefined : 'transparent'}
      />
      {children}
    </PageColumn>
  );
}
