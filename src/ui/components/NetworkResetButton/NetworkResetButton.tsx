import React from 'react';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import * as helperStyles from 'src/ui/style/helpers.module.css';

export function NetworkResetButton({ onClick }: { onClick: () => void }) {
  return (
    <UnstyledButton onClick={onClick} className={helperStyles.hoverUnderline}>
      <div>Show All Networks</div>
    </UnstyledButton>
  );
}
