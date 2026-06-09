import React from 'react';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { Frame } from 'src/ui/ui-kit/Frame';
import { ToggleSettingLine } from 'src/ui/pages/Settings/ToggleSettingsLine';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';

export function SwapSettingsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { preferences, setPreferences } = usePreferences();
  return (
    <Dialog2
      open={open}
      onClose={onClose}
      title="Settings"
      size="content"
      autoFocusInput={false}
    >
      <div style={{ padding: 16, paddingTop: 0 }}>
        <Frame>
          <ToggleSettingLine
            text="Receive to another address"
            checked={preferences?.receiveToAnotherAddress ?? false}
            onChange={(event) => {
              setPreferences({
                receiveToAnotherAddress: event.target.checked,
              });
            }}
            detailText="Send swapped tokens to any wallet you choose"
          />
        </Frame>
      </div>
      <div style={{ height: 24 }} />
    </Dialog2>
  );
}
