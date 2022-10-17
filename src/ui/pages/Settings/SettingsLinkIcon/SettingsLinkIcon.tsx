import React from 'react';
import SettingsIcon from 'jsx:src/ui/assets/settings.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { useSettingsTodosCount } from '../useSettingsTodosCount';
import * as s from './styles.module.css';

export function SettingsLinkIcon() {
  const count = useSettingsTodosCount();
  return (
    <UnstyledLink to="/settings" title="Settings" className={s.button}>
      <div style={{ position: 'relative' }}>
        <SettingsIcon style={{ display: 'block' }} />
        {count > 0 ? (
          <UIText
            kind="body/s_reg"
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
    </UnstyledLink>
  );
}
