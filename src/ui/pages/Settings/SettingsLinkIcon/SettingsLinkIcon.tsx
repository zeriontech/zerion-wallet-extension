import React from 'react';
import SettingsIcon from 'jsx:src/ui/assets/settings.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { Button } from 'src/ui/ui-kit/Button';
import { useFeatureOnboarding } from 'src/ui/features/preferences/usePreferences';
import { useSettingsTodosCount } from '../useSettingsTodosCount';

export function SettingsLinkIcon() {
  const count = useSettingsTodosCount();
  const { visible } = useFeatureOnboarding();
  return (
    <Button
      kind="ghost"
      as={UnstyledLink}
      size={36}
      to="/settings"
      title="Settings"
      style={{ paddingInline: 8 }}
    >
      <div style={{ position: 'relative' }}>
        <SettingsIcon style={{ display: 'block', width: 20, height: 20 }} />
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
        ) : visible ? (
          <UIText
            kind="body/regular"
            style={{
              borderRadius: 6,
              width: 26,
              height: 14,
              backgroundColor: 'var(--primary)',
              border: '1px solid var(--white)',
              color: 'var(--always-white)',
              fontSize: 9,
              textAlign: 'center',
              lineHeight: '12px',
              position: 'absolute',
              top: -5,
              right: -16,
            }}
          >
            New
          </UIText>
        ) : null}
      </div>
    </Button>
  );
}
