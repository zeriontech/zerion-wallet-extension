import React, { useId } from 'react';
import { produce } from 'immer';
import merge from 'lodash/merge';
import ArrowDownIcon from 'jsx:src/ui/assets/arrow-down.svg';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { Button } from 'src/ui/ui-kit/Button';
import { Input } from 'src/ui/ui-kit/Input';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { Content } from 'react-area';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { createChain } from 'src/modules/networks/Chain';
import { collectData } from 'src/ui/shared/form-data';

const Field = React.forwardRef(
  (
    {
      label,
      disabled,
      ...inputProps
    }: {
      label: React.ReactNode;
    } & React.InputHTMLAttributes<HTMLInputElement>,
    ref: React.Ref<HTMLInputElement>
  ) => {
    const id = useId();
    return (
      <VStack gap={4}>
        <UIText kind="small/accent" as="label" htmlFor={id}>
          {label}
        </UIText>
        <ZStack>
          <Input
            id={id}
            ref={ref}
            disabled={disabled}
            boxHeight={40}
            {...inputProps}
          />
        </ZStack>
      </VStack>
    );
  }
);

export function RpcUrlForm({
  network,
  prevNetwork,
  isSubmitting,
  onSubmit,
  onCancel,
  rpcUrlHelpHref,
}: {
  network: NetworkConfig;
  prevNetwork: NetworkConfig;
  rpcUrlHelpHref: string;
  isSubmitting: boolean;
  onSubmit: (result: NetworkConfig) => void;
  onCancel: () => void;
}) {
  const { networks } = useNetworks();

  const currentRpcUrl = networks?.getRpcUrlInternal(
    createChain(prevNetwork.chain)
  );

  const id = useId();

  if (!networks) {
    return (
      <DelayedRender>
        <ViewLoading kind="network" />
      </DelayedRender>
    );
  }

  return (
    <form
      id={id}
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.checkValidity()) {
          return;
        }
        const formObject = collectData(form, {});
        // Use prevNetwork as base, overwrite only values used in current form
        const result = produce(prevNetwork, (draft) =>
          merge(draft, formObject)
        );
        onSubmit(result);
      }}
    >
      <VStack gap={16}>
        <Field
          label="Current RPC URL"
          type="url"
          defaultValue={currentRpcUrl || ''}
          readOnly={true}
          // omit name attribute so that it's not collected on submit
          name={undefined}
          required={true}
        />
        <ArrowDownIcon
          style={{ width: 24, height: 24, color: 'var(--neutral-500)' }}
        />
        {prevNetwork.rpc_url_internal || prevNetwork.rpc_url_user ? (
          /**
           * If network HAS `rpc_url_internal`, we introduce a `rpc_url_user` field
           * as a mechanism to overwrite it,
           * else - we use `rpc_url_public`
           */
          <Field
            label="New RPC URL"
            name="rpc_url_user"
            type="url"
            defaultValue={network.rpc_url_public?.[0] || ''}
            required={true}
          />
        ) : (
          <Field
            label="New RPC URL"
            name="rpc_url_public[]"
            type="url"
            defaultValue={network.rpc_url_public?.[0] || ''}
            required={true}
          />
        )}
        <UIText kind="small/regular" color="var(--neutral-500)">
          You can always revert this change and switch back to the default RPC
          URL from your network settings at any time
        </UIText>
      </VStack>
      <Spacer height={16} />
      <UIText
        as={UnstyledLink}
        to={rpcUrlHelpHref}
        kind="small/accent"
        color="var(--primary)"
      >
        <span className={helperStyles.hoverUnderline}>
          What is RPC URLs and Potential Risks
        </span>
      </UIText>
      <Spacer height={20} />
      <Content name="add-ethereum-chain-footer">
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
          <Button form={id} disabled={isSubmitting} kind="primary">
            {isSubmitting ? 'Loading...' : 'Update'}
          </Button>
        </div>
      </Content>
    </form>
  );
}
