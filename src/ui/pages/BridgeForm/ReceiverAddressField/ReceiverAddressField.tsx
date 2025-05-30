import React from 'react';
import { HiddenValidationInput } from 'src/ui/shared/forms/HiddenValidationInput';
import AddCircleIcon from 'jsx:src/ui/assets/add-circle-outlined.svg';
import RemoveIcon from 'jsx:src/ui/assets/trash.svg';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { AddressInputWrapper } from '../../SendForm/fieldsets/AddressInput';
import * as styles from './styles.module.css';

export function ReceiverAddressField({
  title,
  to,
  receiverAddressInput,
  showAddressInput,
  onShowInputChange,
  onChange,
  onResolvedChange,
  filterAddressPredicate,
}: {
  title: React.ReactNode;
  to: string | null;
  receiverAddressInput: string | null;
  onChange(value: string | null): void;
  showAddressInput: boolean;
  onShowInputChange(value: boolean): void;
  onResolvedChange(value: string): void;
  filterAddressPredicate: (address: string) => boolean;
}) {
  return (
    <>
      <VStack gap={0} className={styles.container}>
        {showAddressInput ? (
          <HStack
            gap={8}
            justifyContent="space-between"
            alignItems="center"
            style={{ padding: '12px 16px' }}
          >
            <UIText kind="small/regular">{title}</UIText>
            <UnstyledButton
              type="button"
              onClick={() => onShowInputChange(false)}
            >
              <RemoveIcon />
            </UnstyledButton>
          </HStack>
        ) : (
          <UnstyledButton type="button" onClick={() => onShowInputChange(true)}>
            <HStack
              gap={8}
              justifyContent="space-between"
              alignItems="center"
              style={{ padding: '12px 16px' }}
            >
              <UIText kind="small/regular">{title}</UIText>
              <AddCircleIcon />
            </HStack>
          </UnstyledButton>
        )}
        {showAddressInput ? (
          <>
            <HiddenValidationInput
              customValidity={to ? '' : 'Cannot resolve recipient'}
            />
            <AddressInputWrapper
              fieldsetStyle={{ border: 'none', paddingTop: 0 }}
              title={null}
              name="receiverAddressInput"
              value={receiverAddressInput ?? ''}
              required={true}
              resolvedAddress={to ?? null}
              onChange={onChange}
              onResolvedChange={onResolvedChange}
              filterAddressPredicate={filterAddressPredicate}
            />
          </>
        ) : null}
      </VStack>
    </>
  );
}
