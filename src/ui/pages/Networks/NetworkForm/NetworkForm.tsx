import React, { useId, useState } from 'react';
import { Content } from 'react-area';
import { produce } from 'immer';
import merge from 'lodash/merge';
import { Button } from 'src/ui/ui-kit/Button';
import { Input } from 'src/ui/ui-kit/Input';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import LockIcon from 'jsx:src/ui/assets/lock.svg';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import { Toggle } from 'src/ui/ui-kit/Toggle';
import { HStack } from 'src/ui/ui-kit/HStack';
import { collectData } from 'src/ui/shared/form-data';
import type { AddEthereumChainParameter } from 'src/modules/ethereum/types/AddEthereumChainParameter';
import {
  toCustomNetworkId,
  isCustomNetworkId,
} from 'src/modules/ethereum/chains/helpers';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import { apostrophe } from 'src/ui/shared/typography';

export function Field({
  label,
  error,
  disabled,
  ...inputProps
}: {
  label: React.ReactNode;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const ICON_SIZE = 24;
  const ICON_OFFSET = 8;
  return (
    <VStack gap={4}>
      <UIText kind="small/accent" as="label" htmlFor={id}>
        {label}
      </UIText>
      <ZStack>
        <Input
          id={id}
          error={Boolean(error)}
          disabled={disabled}
          boxHeight={40}
          style={
            disabled ? { paddingRight: ICON_OFFSET * 2 + ICON_SIZE } : undefined
          }
          {...inputProps}
        />
        {disabled ? (
          <LockIcon
            style={{
              color: 'var(--neutral-500)',
              width: ICON_SIZE,
              height: ICON_SIZE,
              alignSelf: 'center',
              justifySelf: 'end',
              marginRight: ICON_OFFSET,
            }}
          />
        ) : null}
      </ZStack>
      {error ? (
        <UIText kind="caption/regular" style={{ color: 'var(--negative-500)' }}>
          {error}
        </UIText>
      ) : null}
    </VStack>
  );
}

type Validators = Record<
  string,
  (event: HTMLInputElement) => string | undefined
>;

function collectErrors(form: HTMLFormElement, validators: Validators) {
  const errors: Record<string, string | undefined> = {};
  for (const element of form.elements) {
    if (element instanceof HTMLInputElement) {
      const validity = validators[element.name]?.(element);
      if (validity) {
        errors[element.name] = validity;
      }
      element.setCustomValidity(validity ?? '');
    }
  }
  return errors;
}

function findInput(
  elements: HTMLFormControlsCollection,
  predicate: (el: HTMLInputElement) => boolean
) {
  return Array.from(elements).find((el): el is HTMLInputElement => {
    return el instanceof HTMLInputElement && predicate(el);
  });
}

function hasChanges(form: HTMLFormElement) {
  for (const element of form.elements) {
    if (element instanceof HTMLInputElement) {
      if (element.value !== element.defaultValue) {
        return true;
      }
    }
  }
  return false;
}

const parsers = {
  chainId: (untypedValue: unknown) => {
    const value = untypedValue as string;
    return normalizeChainId(value);
  },
  hidden: (untypedValue: unknown) => {
    const value = untypedValue as 'on' | null;
    return Boolean(value);
  },
  'nativeCurrency.decimals': (untypedValue: unknown) => {
    const value = untypedValue as string;
    return Number(value);
  },
};

function NetworkHiddenFieldLine({
  name,
  defaultChecked,
}: {
  name: string;
  defaultChecked?: boolean;
}) {
  const id = useId();
  const [checked, setState] = useState(defaultChecked);
  return (
    <HStack gap={4} justifyContent="space-between">
      <UIText kind="body/accent" as="label" htmlFor={id}>
        Visible in Networks List
      </UIText>
      <Toggle
        id={id}
        /**
         * This input intentionally has no "name" attribute,
         * its value will not be part of form data.
         * It is a visual inversion of the "hidden" attribute
         */
        checked={!checked}
        onChange={(event) => setState(!event.currentTarget.checked)}
      />
      <input name={name} type="hidden" value={checked ? 'on' : ''} />
    </HStack>
  );
}

const EMPTY_OBJECT = {};
export function NetworkForm({
  chain,
  chainConfig,
  submitText = 'Save',
  isSubmitting,
  onSubmit,
  onCancel,
  onReset,
  onRemoveFromVisited,
  footerRenderArea,
  restrictedChainIds,
  disabledFields,
}: {
  chain?: string | null;
  chainConfig: AddEthereumChainParameter;
  isSubmitting: boolean;
  submitText?: string;
  onSubmit: (chain: string, result: AddEthereumChainParameter) => void;
  onCancel: () => void;
  onReset?: () => void;
  onRemoveFromVisited?: () => void;
  footerRenderArea?: string;
  restrictedChainIds: Set<ChainId>;
  disabledFields: null | Set<string>;
}) {
  const id = useId();
  const validators: Validators = {
    chainId: (element) => {
      const value = parsers.chainId(element.value);
      if (restrictedChainIds.has(value)) {
        return 'Network already exists';
      }
      try {
        normalizeChainId(value);
        normalizeChainId(Number(value));
      } catch (error) {
        return `Unsupported chainId${apostrophe}s format`;
      }
    },
  };
  const [errors, setErrors] =
    useState<Record<string, string | undefined>>(EMPTY_OBJECT);
  const submitRow = (
    <div
      style={{
        marginTop: 'auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
      }}
    >
      <Button type="button" kind="regular" onClick={onCancel}>
        Cancel
      </Button>
      <Button disabled={isSubmitting} kind="primary" form={id}>
        {isSubmitting ? 'Loading...' : submitText}
      </Button>
    </div>
  );
  return (
    <>
      <form
        id={id}
        onChange={() => setErrors(EMPTY_OBJECT)}
        onSubmit={(event) => {
          event.preventDefault();
          if (!hasChanges(event.currentTarget)) {
            onCancel();
            return;
          }
          const { elements } = event.currentTarget;
          const errors = collectErrors(event.currentTarget, validators);
          setErrors(errors);
          if (!event.currentTarget.checkValidity()) {
            const input = findInput(elements, (e) => e.name in errors);
            input?.focus();
            return;
          }
          const formObject = collectData(event.currentTarget, parsers);
          const result = produce(chainConfig, (draft) =>
            merge(draft, formObject)
          );
          onSubmit(
            // custom network id should be generated from (probably) updated chainId
            !chain || isCustomNetworkId(chain)
              ? toCustomNetworkId(result.chainId)
              : chain,
            result
          );
        }}
      >
        <VStack gap={8}>
          <Field
            label="Network Name"
            name="chainName"
            defaultValue={chainConfig.chainName}
            disabled={disabledFields?.has('chainName')}
            required
          />
          <Field
            label="RPC URL"
            name="rpcUrls[]"
            placeholder={chainConfig.rpcUrls[0]}
            type="url"
            defaultValue={chainConfig.rpcUrls[0] || ''}
            error={errors['rpcUrls[]']}
            disabled={disabledFields?.has('rpcUrls[]')}
            required={true}
          />
          <Field
            label={<span title={chainConfig.chainId}>Chain ID</span>}
            name="chainId"
            title={chainConfig.chainId}
            defaultValue={
              chainConfig.chainId ? String(parseInt(chainConfig.chainId)) : ''
            }
            pattern="^0x[\dabcdef]+|\d+"
            error={errors.chainId}
            onInvalid={(event) =>
              event.currentTarget.setCustomValidity(
                'Chain ID must be either a 0x-prefixed hex value or an integer'
              )
            }
            onInput={(event) => event.currentTarget.setCustomValidity('')}
            disabled={disabledFields?.has('chainId')}
            required
          />
          <Field
            label="Currency Symbol"
            name="nativeCurrency.symbol"
            defaultValue={chainConfig.nativeCurrency.symbol || ''}
            error={errors['nativeCurrency.symbol']}
            onInput={(event) => event.currentTarget.setCustomValidity('')}
            disabled={disabledFields?.has('nativeCurrency.symbol')}
            required
          />
          <Field
            label="Decimals"
            name="nativeCurrency.decimals"
            error={errors['nativeCurrency.decimals']}
            placeholder="18"
            inputMode="decimal"
            pattern="\d+"
            defaultValue={chainConfig.nativeCurrency.decimals || ''}
            disabled={disabledFields?.has('nativeCurrency.decimals')}
            required={false}
          />
          <Field
            label="Block Explorer URL (optional)"
            type="url"
            name="blockExplorerUrls[]"
            data-parser-name="toLowerCase"
            error={errors['blockExplorerUrls[]']}
            placeholder="https://..."
            defaultValue={chainConfig.blockExplorerUrls?.[0] || ''}
            disabled={disabledFields?.has('blockExplorerUrls[]')}
            required={false}
          />
        </VStack>
        {disabledFields?.has('hidden') ? null : (
          <>
            <Spacer height={20} />
            <NetworkHiddenFieldLine
              name="hidden"
              defaultChecked={chainConfig.hidden}
            />
          </>
        )}
        {onReset ? (
          <>
            <Spacer height={24} />
            <UnstyledButton
              type="button"
              style={{ width: '100%', color: 'var(--primary)' }}
              className={helperStyles.hoverUnderline}
              onClick={onReset}
            >
              <UIText kind="small/accent">Reset to Default</UIText>
            </UnstyledButton>
          </>
        ) : onRemoveFromVisited ? (
          <>
            <Spacer height={24} />
            <UnstyledButton
              type="button"
              style={{ width: '100%', color: 'var(--primary)' }}
              className={helperStyles.hoverUnderline}
              onClick={onRemoveFromVisited}
            >
              <UIText kind="small/accent">Remove from the list</UIText>
            </UnstyledButton>
          </>
        ) : null}
      </form>
      <Spacer height={20} />
      {footerRenderArea ? (
        <Content name={footerRenderArea}>{submitRow}</Content>
      ) : (
        submitRow
      )}
    </>
  );
}
