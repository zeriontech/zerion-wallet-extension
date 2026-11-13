import React, { useCallback, useMemo } from 'react';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import { applyCustomAllowance } from 'src/modules/ethereum/transactions/appovals';
import { getLabelAddressCopiedParams } from 'src/shared/analytics/shared/labelAddressCopied';
import { emitter } from 'src/ui/shared/events';
import { RecipientLine } from '../RecipientLine';
import { ApplicationLine, ApplicationWalletLine } from '../ApplicationLine';
import { ActInfo } from '../ActInfo';
import { getLabelLine } from '../getLabelLine';

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
  network: NetworkInfo;
  allowanceQuantityCommon: string | null;
  customAllowanceQuantityBase: string | null;
  showApplicationLine: boolean;
  singleAssetElementEnd: React.ReactNode;
}) {
  const labelLine = getLabelLine(addressAction?.label);
  const applicationLineVisible =
    showApplicationLine &&
    (labelLine?.kind === 'application-contract' || labelLine?.kind === 'application-wallet');

  const handleLabelCopy = useCallback(() => {
    if (!addressAction?.label) {
      return;
    }
    const params = getLabelAddressCopiedParams({
      label: addressAction.label,
      chain: network.id,
      actType: addressAction.type.value,
      screen: 'signing_preview',
      isOwnWallet: false,
    });
    if (params) {
      emitter.emit('labelAddressCopied', params);
    }
  }, [addressAction, network.id]);

  const actionWithAppliedAllowance = useMemo(
    () =>
      applyCustomAllowance({
        addressAction,
        customAllowanceQuantityCommon: allowanceQuantityCommon,
        customAllowanceQuantityBase,
      }),
    [addressAction, allowanceQuantityCommon, customAllowanceQuantityBase],
  );

  const showEndElement =
    addressAction?.acts?.length === 1 &&
    !addressAction.acts[0].content?.transfers &&
    addressAction.acts[0].content?.approvals?.length === 1;

  return (
    <>
      {labelLine?.kind === 'address' ? (
        <RecipientLine
          caption={labelLine.caption}
          recipientAddress={labelLine.address}
          recipientName={labelLine.name || null}
          showNetworkIcon={!applicationLineVisible}
          network={network}
          copyOnly={labelLine.copyOnly}
          onCopy={handleLabelCopy}
        />
      ) : null}
      {applicationLineVisible && labelLine.kind === 'application-contract' && addressAction ? (
        <ApplicationLine addressAction={addressAction} network={network} />
      ) : null}
      {applicationLineVisible && labelLine.kind === 'application-wallet' ? (
        <ApplicationWalletLine
          caption={labelLine.caption}
          address={labelLine.address}
          network={network}
          copyOnly={labelLine.copyOnly}
          onCopy={handleLabelCopy}
        />
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
