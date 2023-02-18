import React, { useContext, useEffect, useState } from 'react';
import { BUG_REPORT_BUTTON_HEIGHT } from '../BugReportButton';
import { PageColumn } from '../PageColumn';
import { PageFullBleedLine } from '../PageFullBleedLine';
import { UIContext } from '../UIContext';

function canBeScrolled(node: HTMLElement) {
  return node.scrollHeight > node.clientHeight;
}

export function PageStickyFooter({
  children,
  style,
  lineColor,
}: React.HTMLAttributes<HTMLDivElement> & { lineColor?: string }) {
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
        bottom: BUG_REPORT_BUTTON_HEIGHT,
        backgroundColor: 'var(--background)',
        ...style,
      }}
    >
      <PageFullBleedLine
        lineColor={drawTopBorder ? lineColor : 'transparent'}
      />
      {children}
    </PageColumn>
  );
}
