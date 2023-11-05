import React, { useId, useRef } from 'react';
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
  oldNetwork,
  isSubmitting,
  onSubmit,
  onCancel,
  rpcUrlHelpHref,
}: {
  network: NetworkConfig;
  oldNetwork: NetworkConfig;
  rpcUrlHelpHref: string;
  isSubmitting: boolean;
  onSubmit: (result: NetworkConfig) => void;
  onCancel: () => void;
}) {
  const id = useId();
  const newRpcUrlRef = useRef<HTMLInputElement | null>(null);

  const currentRpcUrl =
    oldNetwork.rpc_url_user || oldNetwork.rpc_url_public?.[0];

  return (
    <form
      id={id}
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.checkValidity()) {
          newRpcUrlRef.current?.focus();
          newRpcUrlRef.current?.checkValidity();
          return;
        }
        const formData = new FormData(form);
        const newRpcUrl = formData.get('new_rpc_url') as string;
        const result = produce(network, (draft) =>
          merge(draft, { rpc_url_user: newRpcUrl })
        );
        onSubmit(result);
      }}
    >
      <VStack gap={16}>
        <Field
          label="Current RPC URL"
          name="current_rpc_url"
          type="url"
          defaultValue={currentRpcUrl || ''}
          disabled={true}
          required={true}
        />
        <ArrowDownIcon
          style={{ width: 16, height: 16, color: 'var(--neutral-500)' }}
        />
        <Field
          ref={newRpcUrlRef}
          label="New RPC URL"
          name="new_rpc_url"
          type="url"
          defaultValue={network.rpc_url_public?.[0] || ''}
          required={true}
        />
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
          <Button disabled={isSubmitting} kind="primary" form={id}>
            {isSubmitting ? 'Loading...' : 'Update'}
          </Button>
        </div>
      </Content>
    </form>
  );
}
