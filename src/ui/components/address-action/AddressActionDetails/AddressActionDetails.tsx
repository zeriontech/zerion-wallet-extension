import React, { useMemo } from 'react';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { produce } from 'immer';
import { isUnlimitedApproval } from 'src/ui/pages/History/isUnlimitedApproval';
import { RecipientLine } from '../RecipientLine';
import { ApplicationLine } from '../ApplicationLine';
import { ActInfo } from '../ActInfo';

export function AddressActionDetails({
  address,
  addressAction,
  network,
  allowanceQuantityCommon,
  customAllowanceQuantityBase,
  showApplicationLine,
  singleAssetElementEnd,
}: {
  address: string;
  addressAction?: AnyAddressAction;
  network: NetworkConfig;
  allowanceQuantityCommon: string | null;
  customAllowanceQuantityBase: string | null;
  showApplicationLine: boolean;
  singleAssetElementEnd: React.ReactNode;
}) {
  const recipientAddress = addressAction?.label?.wallet?.address;
  const showRecipientLine =
    recipientAddress && addressAction?.type.value === 'send';
  const applicationLineVisible =
    showApplicationLine && addressAction?.label?.contract && !showRecipientLine;

  const actionWithAppliedAllowance = useMemo(() => {
    if (
      allowanceQuantityCommon == null ||
      addressAction?.acts?.length !== 1 ||
      addressAction.acts[0].content?.approvals?.length !== 1
    ) {
      return addressAction;
    }
    return produce(addressAction, (draft) => {
      if (draft.acts?.[0].content?.approvals?.[0].amount) {
        draft.acts[0].content.approvals[0].amount.quantity =
          allowanceQuantityCommon;
        draft.acts[0].content.approvals[0].unlimited = isUnlimitedApproval(
          customAllowanceQuantityBase
        );
      }
    });
  }, [addressAction, allowanceQuantityCommon, customAllowanceQuantityBase]);

  const showEndElement =
    addressAction?.acts?.length === 1 &&
    !addressAction.acts[0].content?.transfers &&
    addressAction.acts[0].content?.approvals?.length === 1;

  return (
    <>
      {showRecipientLine ? (
        <RecipientLine
          recipientAddress={recipientAddress}
          recipientName={addressAction.label?.wallet?.name || null}
          showNetworkIcon={!applicationLineVisible}
          network={network}
        />
      ) : null}
      {applicationLineVisible ? (
        <ApplicationLine addressAction={addressAction} network={network} />
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
