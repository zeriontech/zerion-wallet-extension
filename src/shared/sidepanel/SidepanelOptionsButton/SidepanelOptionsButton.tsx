import React, { useMemo } from 'react';
import SidepanelIcon from 'jsx:src/ui/assets/sidepanel.svg';
import PopupIcon from 'jsx:src/ui/assets/popup.svg';
import { Button } from 'src/ui/ui-kit/Button';
import { urlContext } from 'src/shared/UrlContext';
import { openSidePanel } from '../sidepanel-apis';
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
        title={isSidepanel ? 'Close Sidepanel' : 'Open Sidepanel'}
        kind="ghost"
        size={36}
        style={{ paddingInline: 8, ['anchorName' as string]: '--popover-1' }}
        onClick={async () => {
          if (!isSidepanel) {
            openSidePanel({
              pathname: '/',
              searchParams: null,
              openPanelOnActionClickParam: true,
            });
            closeIfNotInTab();
          } else {
            await chrome.sidePanel.setPanelBehavior({
              openPanelOnActionClick: false,
            });
            window.close();
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
