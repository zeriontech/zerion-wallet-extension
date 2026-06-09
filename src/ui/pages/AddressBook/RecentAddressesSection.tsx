import React from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import PersonAddIcon from 'jsx:src/ui/assets/person-add.svg';
import { AddressBookRow } from './AddressBookRow';

export function RecentAddressesSection({
  addresses,
  onAdd,
}: {
  addresses: string[];
  onAdd: (address: string) => void;
}) {
  if (addresses.length === 0) {
    return null;
  }
  return (
    <VStack gap={4}>
      <UIText
        kind="small/accent"
        color="var(--neutral-700)"
        style={{ paddingLeft: 4, paddingTop: 12 }}
      >
        Recent
      </UIText>
      <VStack gap={0}>
        {addresses.map((address) => (
          <AddressBookRow
            key={address}
            entry={{ address }}
            showAddressHint={false}
            rightSlot={
              <UnstyledButton
                type="button"
                onClick={() => onAdd(address)}
                title="Add to Address Book"
                style={{ display: 'flex', color: 'var(--primary-500)' }}
              >
                <PersonAddIcon style={{ width: 24, height: 24 }} />
              </UnstyledButton>
            }
          />
        ))}
      </VStack>
    </VStack>
  );
}
