import React from 'react';
import SettingsIcon from 'jsx:src/ui/assets/settings.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { Button } from 'src/ui/ui-kit/Button';
import { useSettingsTodosCount } from '../useSettingsTodosCount';

export function SettingsLinkIcon() {
  const count = useSettingsTodosCount();
  return (
    <Button
      kind="ghost"
      as={UnstyledLink}
      size={40}
      to="/settings"
      title="Settings"
      style={{ width: 40, paddingInline: 8 }}
    >
      <div style={{ position: 'relative' }}>
        <SettingsIcon style={{ display: 'block' }} />
        {count > 0 ? (
          <UIText
            kind="body/regular"
            style={{
              borderRadius: '50%',
              width: 12,
              height: 12,
              backgroundColor: 'var(--negative-500)',
              color: 'var(--always-white)',
              fontSize: 9,
              textAlign: 'center',
              lineHeight: '12px',
              position: 'absolute',
              top: -1,
              right: -1,
            }}
          >
            {count}
          </UIText>
        ) : null}
      </div>
    </Button>
  );
}
