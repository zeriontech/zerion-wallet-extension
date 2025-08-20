import React, { useMemo } from 'react';
import type { AnyAction } from 'src/modules/ethereum/transactions/addressAction';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { produce } from 'immer';
import { isUnlimitedApproval } from 'src/ui/pages/History/isUnlimitedApproval';
import { RecipientLine } from '../RecipientLine';
import { ApplicationLine } from '../ApplicationLine';
import { ActInfo } from '../ActInfo';

export function AddressActionDetails({
  address,
  action,
  network,
  allowanceQuantityCommon,
  customAllowanceQuantityBase,
  showApplicationLine,
  singleAssetElementEnd,
}: {
  address: string;
  action?: AnyAction;
  network: NetworkConfig;
  allowanceQuantityCommon: string | null;
  customAllowanceQuantityBase: string | null;
  showApplicationLine: boolean;
  singleAssetElementEnd: React.ReactNode;
}) {
  const recipientAddress = action?.label?.wallet?.address;
  const showRecipientLine = recipientAddress && action?.type.value === 'send';
  const applicationLineVisible =
    showApplicationLine && action?.label?.contract && !showRecipientLine;

  const actionWithAppliedAllowance = useMemo(() => {
    if (
      allowanceQuantityCommon == null ||
      action?.acts.length !== 1 ||
      action.acts[0].content?.approvals?.length !== 1
    ) {
      return action;
    }
    return produce(action, (draft) => {
      if (draft.acts[0].content?.approvals?.[0].amount) {
        draft.acts[0].content.approvals[0].amount.quantity =
          allowanceQuantityCommon;
        draft.acts[0].content.approvals[0].unlimited = isUnlimitedApproval(
          customAllowanceQuantityBase
        );
      }
    });
  }, [action, allowanceQuantityCommon, customAllowanceQuantityBase]);

  const showEndElement =
    action?.acts.length === 1 &&
    !action.acts[0].content?.transfers &&
    action.acts[0].content?.approvals?.length === 1;

  return (
    <>
      {showRecipientLine ? (
        <RecipientLine
          recipientAddress={recipientAddress}
          showNetworkIcon={!applicationLineVisible}
          network={network}
        />
      ) : null}
      {applicationLineVisible ? (
        <ApplicationLine action={action} network={network} />
      ) : null}
      {actionWithAppliedAllowance?.acts?.length ? (
        <VStack gap={4}>
          {actionWithAppliedAllowance.acts.map((act, index) => (
            <ActInfo
              key={index}
              address={address}
              act={act}
              elementEnd={showEndElement ? singleAssetElementEnd : null}
              initialDelay={300 * index}
            />
          ))}
        </VStack>
      ) : null}
    </>
  );
}
