import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import * as styles from './DetailRow.module.css';

export function DetailRow({
  label,
  value,
  onClick,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  onClick?: () => void;
}) {
  const content = (
    <HStack gap={8} justifyContent="space-between" alignItems="center">
      <UIText kind="small/regular">{label}</UIText>
      <UIText kind="small/accent">{value}</UIText>
    </HStack>
  );
  if (onClick) {
    return (
      <UnstyledButton onClick={onClick} className={styles.detailLinkRow}>
        {content}
      </UnstyledButton>
    );
  }
  return content;
}
