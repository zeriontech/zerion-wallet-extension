import React, { useId } from 'react';
import { produce } from 'immer';
import merge from 'lodash/merge';
import ArrowDownIcon from 'jsx:src/ui/assets/arrow-down.svg';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { Content } from 'react-area';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { createChain } from 'src/modules/networks/Chain';
import { collectData } from 'src/ui/shared/form-data';
import type { AddEthereumChainParameter } from 'src/modules/ethereum/types/AddEthereumChainParameter';
import { toAddEthereumChainParameter } from 'src/modules/networks/helpers';
import { Field } from '../../Networks/NetworkForm/NetworkForm';

export function RpcUrlForm({
  network,
  prevNetwork,
  isSubmitting,
  onSubmit,
  onKeepCurrent,
  rpcUrlHelpHref,
}: {
  network: NetworkConfig;
  prevNetwork: NetworkConfig;
  rpcUrlHelpHref: string;
  isSubmitting: boolean;
  onSubmit: (chain: string, result: AddEthereumChainParameter) => void;
  onKeepCurrent: () => void;
}) {
  const { networks } = useNetworks();

  const currentRpcUrl = networks?.getRpcUrlInternal(
    createChain(prevNetwork.id)
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
        onSubmit(network.id, toAddEthereumChainParameter(result));
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
        <Field
          label="New RPC URL"
          /**
           * If network HAS `rpc_url_internal`, we introduce a `rpc_url_user` field
           * as a mechanism to overwrite it,
           * else - we use `rpc_url_public`
           */
          name={
            prevNetwork.rpc_url_internal || prevNetwork.rpc_url_user
              ? 'rpc_url_user'
              : 'rpc_url_public[]'
          }
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
          <Button type="button" kind="regular" onClick={onKeepCurrent}>
            Keep Current
          </Button>
          <Button form={id} disabled={isSubmitting} kind="primary">
            {isSubmitting ? 'Loading...' : 'Accept'}
          </Button>
        </div>
      </Content>
    </form>
  );
}
