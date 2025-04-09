import React from 'react';
import { HiddenValidationInput } from 'src/ui/shared/forms/HiddenValidationInput';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Toggle } from 'src/ui/ui-kit/Toggle';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { AddressInputWrapper } from '../../SendForm/fieldsets/AddressInput';

export function ReceiverAddressField({
  to,
  receiverAddressInput,
  showAddressInput,
  onShowInputChange,
  onChange,
  onResolvedChange,
}: {
  to: string | null;
  receiverAddressInput: string | null;
  onChange(value: string | null): void;
  showAddressInput: boolean;
  onShowInputChange(value: boolean): void;
  onResolvedChange(value: string): void;
}) {
  return (
    <VStack gap={4}>
      <HStack gap={8} justifyContent="space-between" alignItems="center">
        <UIText kind="small/regular">Bridge and send to another address</UIText>
        <Toggle
          checked={showAddressInput}
          onChange={(event) => onShowInputChange(event.currentTarget.checked)}
        />
      </HStack>
      {showAddressInput ? (
        <>
          <HiddenValidationInput
            customValidity={to ? '' : 'Cannot resolve recipient'}
          />
          <AddressInputWrapper
            name="receiverAddressInput"
            value={receiverAddressInput ?? ''}
            required={true}
            resolvedAddress={to ?? null}
            onChange={onChange}
            onResolvedChange={onResolvedChange}
          />
        </>
      ) : null}
    </VStack>
  );
}
