import { ethers } from 'ethers';
import { Content } from 'react-area';
import { produce } from 'immer';
import merge from 'lodash/merge';
import lodashSet from 'lodash/set';
import React, { useId, useState } from 'react';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
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

type InitialNetworkConfig = Omit<NetworkConfig, 'chain'> & {
  chain: string | null;
};
function isCompleteNetwork(x: InitialNetworkConfig): x is NetworkConfig {
  return x.chain != null && x.chain !== '';
}

function Field({
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

function naiveFormDataToObject(
  formData: FormData,
  modifier: (key: string, value: unknown) => unknown
) {
  const result: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) {
    if (key.endsWith('[]')) {
      const value = modifier(key, formData.getAll(key));
      lodashSet(result, key.slice(0, -2), value);
    } else {
      const value = modifier(key, formData.get(key));
      lodashSet(result, key, value);
    }
  }
  return result;
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

type Parsers = Record<string, (untypedValue: unknown) => unknown>;

const parsers: Parsers = {
  external_id: (untypedValue) => {
    const value = untypedValue as string;
    if (value.startsWith('0x')) {
      return ethers.utils.hexValue(value);
    } else {
      return ethers.utils.hexValue(Number(value));
    }
  },
  hidden: (untypedValue) => {
    const value = untypedValue as 'on' | null;
    return Boolean(value);
  },
};

function collectData(form: HTMLFormElement, parsers: Parsers) {
  return naiveFormDataToObject(new FormData(form), (key, untypedValue) => {
    if (parsers[key]) {
      return parsers[key](untypedValue);
    } else {
      return untypedValue as string;
    }
  });
}

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
  network,
  submitText = 'Save',
  isSubmitting,
  onSubmit,
  onCancel,
  onReset,
  footerRenderArea,
  restrictedChainIds,
  disabledFields,
}: {
  network: InitialNetworkConfig;
  isSubmitting: boolean;
  submitText?: string;
  onSubmit: (result: NetworkConfig) => void;
  onCancel: () => void;
  onReset?: () => void;
  footerRenderArea?: string;
  restrictedChainIds: Set<string>;
  disabledFields: null | Set<string>;
}) {
  const id = useId();
  const validators: Validators = {
    external_id: (element) => {
      const hexValue = parsers.external_id(element.value) as string;
      if (restrictedChainIds.has(hexValue)) {
        return 'Network already exists';
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

          const { elements } = event.currentTarget;
          const errors = collectErrors(event.currentTarget, validators);
          setErrors(errors);
          if (!event.currentTarget.checkValidity()) {
            const input = findInput(elements, (e) => e.name in errors);
            input?.focus();
            return;
          }
          const formObject = collectData(event.currentTarget, parsers);
          const result = produce(network, (draft) => merge(draft, formObject));
          if (!isCompleteNetwork(result)) {
            onSubmit({ ...result, chain: result.external_id });
          } else {
            onSubmit(result);
          }
        }}
      >
        <VStack gap={8}>
          <Field
            label="Network Name"
            name="name"
            defaultValue={network.name}
            disabled={disabledFields?.has('name')}
            required
          />
          <Field
            label="RPC URL"
            name="rpc_url_public[]"
            type="url"
            defaultValue={network.rpc_url_public?.[0] || ''}
            error={errors['rpc_url_public[]']}
            disabled={disabledFields?.has('rpc_url_public[]')}
            required
          />
          <Field
            label={<span title={network.external_id}>Chain ID</span>}
            name="external_id"
            title={network.external_id}
            defaultValue={
              network.external_id ? String(parseInt(network.external_id)) : ''
            }
            pattern="^0x[\dabcdef]+|\d+"
            error={errors.external_id}
            onInvalid={(event) =>
              event.currentTarget.setCustomValidity(
                'Chain ID must be either a 0x-prefixed hex value or an integer'
              )
            }
            onInput={(event) => event.currentTarget.setCustomValidity('')}
            disabled={disabledFields?.has('external_id')}
            required
          />
          <Field
            label="Currency Symbol"
            name="native_asset.symbol"
            defaultValue={network.native_asset?.symbol || ''}
            pattern=".{2,8}"
            error={errors['native_asset.symbol']}
            onInvalid={(event) =>
              event.currentTarget.setCustomValidity(
                'At least 2 letters, maximum 8 letters'
              )
            }
            onInput={(event) => event.currentTarget.setCustomValidity('')}
            disabled={disabledFields?.has('native_asset.symbol')}
            required
          />
          <Field
            label="Decimals"
            name="native_asset.decimals"
            error={errors['native_asset.decimals']}
            placeholder="18"
            inputMode="decimal"
            pattern="\d+"
            defaultValue={network.native_asset?.decimals || ''}
            disabled={disabledFields?.has('native_asset.decimals')}
            required={false}
          />
          <Field
            label="Block Explorer URL (optional)"
            type="url"
            name="explorer_home_url"
            data-parser-name="toLowerCase"
            error={errors.explorer_home_url}
            placeholder="https://..."
            defaultValue={network.explorer_home_url || ''}
            disabled={disabledFields?.has('explorer_home_url')}
            required={false}
          />
        </VStack>
        <Spacer height={20} />
        {disabledFields?.has('hidden') ? null : (
          <NetworkHiddenFieldLine
            name="hidden"
            defaultChecked={network.hidden}
          />
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
