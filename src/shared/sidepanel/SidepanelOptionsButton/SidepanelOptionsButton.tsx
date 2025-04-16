import React, { useMemo } from 'react';
import SidepanelIcon from 'jsx:src/ui/assets/sidepanel.svg';
import PopupIcon from 'jsx:src/ui/assets/popup.svg';
import { Button } from 'src/ui/ui-kit/Button';
import { urlContext } from 'src/shared/UrlContext';
import { disableSidePanel, openSidePanel } from '../sidepanel-apis';
import { isSidepanelSupported } from '../sidepanel-support';

function closeIfNotInTab() {
  if (urlContext.windowType !== 'tab') {
    window.close();
  }
}

function SidepanelOptionsButtonComponent() {
  const isSidepanel = urlContext.windowType === 'sidepanel';

  return (
    <div style={{ position: 'relative' }}>
      <Button
        title={
          isSidepanel
            ? 'Close Sidepanel, open next time as popup'
            : 'Open Sidepanel'
        }
        kind="ghost"
        size={36}
        style={{ paddingInline: 8, ['anchorName' as string]: '--popover-1' }}
        onClick={async () => {
          if (!isSidepanel) {
            await openSidePanel({
              pathname: '/',
              searchParams: null,
              openPanelOnActionClickParam: true,
            });
            closeIfNotInTab();
          } else {
            await disableSidePanel();
          }
        }}
      >
        {React.createElement(isSidepanel ? PopupIcon : SidepanelIcon, {
          style: {
            display: 'block',
            width: 20,
            height: 20,
          },
        })}
      </Button>
    </div>
  );
}

export function SidepanelOptionsButton() {
  const requiredApisSupported = useMemo(() => {
    const supportsSidepanel = isSidepanelSupported();
    return supportsSidepanel;
  }, []);
  if (!requiredApisSupported) {
    return null;
  }
  return <SidepanelOptionsButtonComponent />;
}
