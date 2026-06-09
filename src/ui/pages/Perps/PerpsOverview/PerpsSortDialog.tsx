import React from 'react';
import CheckIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import type {
  PerpSortField,
  PerpSorting,
} from 'src/modules/hyperliquid/selectPerps';

const OPTIONS: { field: PerpSortField; label: string }[] = [
  { field: 'volume', label: 'Volume' },
  { field: 'price', label: 'Price' },
  { field: 'change', label: 'Change' },
];

export function PerpsSortDialog({
  open,
  onClose,
  sorting,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  sorting: PerpSorting;
  onSelect: (sorting: PerpSorting) => void;
}) {
  return (
    <Dialog2
      open={open}
      onClose={onClose}
      title="Sort by"
      size="content"
      autoFocusInput={false}
    >
      <VStack gap={8} style={{ padding: 16, paddingBottom: 32 }}>
        {OPTIONS.map(({ field, label }) => {
          const isActive = sorting.field === field;
          return (
            <UnstyledButton
              key={field}
              onClick={() => {
                // Selecting the active field is a no-op (only desc supported).
                if (!isActive) {
                  onSelect({ field, direction: 'desc' });
                }
                onClose();
              }}
              style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: 'var(--neutral-100)',
                border: `1px solid ${
                  isActive ? 'var(--primary)' : 'transparent'
                }`,
              }}
            >
              <HStack
                gap={8}
                alignItems="center"
                justifyContent="space-between"
                style={{ gridTemplateColumns: '1fr auto' }}
              >
                <UIText kind="body/accent" style={{ textAlign: 'start' }}>
                  {label}
                </UIText>
                {isActive ? (
                  <CheckIcon
                    style={{
                      width: 20,
                      height: 20,
                      color: 'var(--primary)',
                    }}
                  />
                ) : null}
              </HStack>
            </UnstyledButton>
          );
        })}
      </VStack>
    </Dialog2>
  );
}
