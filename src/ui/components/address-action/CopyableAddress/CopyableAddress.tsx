import React from 'react';
import SuccessIcon from 'jsx:src/ui/assets/checkmark-allowed.svg';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import * as helperStyles from 'src/ui/style/helpers.module.css';

export function CopyableAddress({
  address,
  onCopy,
  children,
}: React.PropsWithChildren<{ address: string; onCopy: () => void }>) {
  const { handleCopy, isSuccess } = useCopyToClipboard({ text: address, onSuccess: onCopy });

  return (
    <UnstyledButton
      type="button"
      onClick={handleCopy}
      className={helperStyles.hoverUnderline}
      title={address}
      style={{ color: 'inherit', cursor: 'pointer' }}
    >
      <HStack gap={3} alignItems="center">
        <span>{children}</span>
        {isSuccess ? (
          <SuccessIcon style={{ width: 16, height: 16, color: 'var(--positive-500)' }} />
        ) : null}
      </HStack>
    </UnstyledButton>
  );
}
