import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Toggle } from 'src/ui/ui-kit/Toggle';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function ToggleSettingLine({
  checked,
  onChange,
  text,
  detailText,
  disabled,
}: {
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  text: NonNullable<React.ReactNode>;
  detailText: React.ReactNode | null;
  disabled?: boolean;
}) {
  return (
    <HStack gap={4} justifyContent="space-between" style={{ padding: 12 }}>
      <VStack gap={0}>
        <UIText kind="body/accent">{text}</UIText>
        {detailText ? (
          <UIText kind="small/regular" color="var(--neutral-500)">
            {detailText}
          </UIText>
        ) : null}
      </VStack>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </HStack>
  );
}
