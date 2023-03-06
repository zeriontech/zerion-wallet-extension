import produce from 'immer';
import React, { useId } from 'react';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { Button } from 'src/ui/ui-kit/Button';
import { Input } from 'src/ui/ui-kit/Input';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as helperStyles from 'src/ui/style/helpers.module.css';

function Field({
  label,
  ...inputProps
}: { label: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <VStack gap={4}>
      {label}
      <Input {...inputProps} />
    </VStack>
  );
}

export function NetworkForm({
  network,
  submitText = 'Save',
  isSubmitting,
  onSubmit,
  onCancel,
  onReset,
}: {
  network: NetworkConfig;
  isSubmitting: boolean;
  submitText?: string;
  onSubmit: (result: NetworkConfig) => void;
  onCancel: () => void;
  onReset?: () => void;
}) {
  const id = useId();
  return (
    <>
      <form
        id={id}
        onSubmit={(event) => {
          event.preventDefault();
          const fd = new FormData(event.currentTarget);
          const obj = Object.fromEntries(fd);
          const entries = Object.entries(obj);
          const topLevelEntries = entries.filter(([key]) => !key.includes('.'));
          const nativeAssetEntries = entries
            .filter(([key]) => key.startsWith('native_asset.'))
            .map(([key, value]) => [key.replace(/^native_asset\./, ''), value]);
          const result = produce(network, (draft) => {
            Object.assign(draft, Object.fromEntries(topLevelEntries));
            Object.assign(
              draft.native_asset || {},
              Object.fromEntries(nativeAssetEntries)
            );
          });
          onSubmit(result);
        }}
      >
        <VStack gap={8}>
          <Field
            label="Network Name"
            name="name"
            defaultValue={network.name}
            required
          />
          <Field
            label="RPC URL"
            name="rpc_url_internal"
            type="url"
            defaultValue={network.rpc_url_internal || ''}
            required
          />
          <Field
            label="Chain ID"
            name="external_id"
            defaultValue={network.external_id || ''}
            pattern="(^0x)?[\dabcdef]+"
            onInvalid={(event) =>
              event.currentTarget.setCustomValidity(
                'Chain ID must be either a 0x-prefixed hex value or an integer'
              )
            }
            onInput={(event) => event.currentTarget.setCustomValidity('')}
            required
          />
          <Field
            label="Symbol"
            name="native_asset.symbol"
            defaultValue={network.native_asset?.symbol || ''}
            pattern=".{3,8}"
            onInvalid={(event) =>
              event.currentTarget.setCustomValidity(
                'At least 3 letters, maximum 8 letters'
              )
            }
            onInput={(event) => event.currentTarget.setCustomValidity('')}
            required
          />
          <Field
            label="Decimals"
            name="native_asset.decimals"
            placeholder="18"
            inputMode="decimal"
            pattern="\d+"
            defaultValue={network.native_asset?.decimals || ''}
            required={false}
          />
          <Field
            label="Block Explorer URL (optional)"
            type="url"
            name="explorer_home_url"
            placeholder="https://..."
            defaultValue={network.explorer_home_url || ''}
            required={false}
          />
        </VStack>
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
    </>
  );
}
