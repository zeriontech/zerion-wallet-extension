import React, { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import type { AddressNFT } from 'defi-sdk';
import type { SendFormView } from '@zeriontech/transactions';
import CheckmarkCheckedIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import { useSelectorStore } from '@store-unit/react';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import DownIcon from 'jsx:src/ui/assets/chevron-down.svg';
import ErrorIcon from 'jsx:src/ui/assets/warning.svg';
import { invariant } from 'src/shared/invariant';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import type { InputHandle } from 'src/ui/ui-kit/Input/DebouncedInput';
import { DebouncedInput } from 'src/ui/ui-kit/Input/DebouncedInput';
import { FormFieldset } from 'src/ui/ui-kit/FormFieldset';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { useCustomValidity } from 'src/ui/shared/forms/useCustomValidity';
import { useAddressNfts } from 'src/ui/shared/requests/addressNfts/useAddressNfts';
import { MediaContent } from 'src/ui/ui-kit/MediaContent';
import { SquareElement } from 'src/ui/ui-kit/SquareElement';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { getRootDomNode } from 'src/ui/shared/getRootDomNode';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { Media } from 'src/ui/ui-kit/Media';
import { Button } from 'src/ui/ui-kit/Button';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { useDefiSdkClient } from 'src/modules/defi-sdk/useDefiSdkClient';
import { useCurrency } from 'src/modules/currency/useCurrency';
import * as styles from './styles.module.css';

function parseNftId(id: string) {
  const [contract_address, token_id] = id.split(':');
  return { contract_address, token_id };
}
function createNftId({
  contract_address,
  token_id,
}: {
  contract_address: string;
  token_id: string;
}) {
  return `${contract_address}:${token_id}`;
}

const rootNode = getRootDomNode();

function NFTList({
  address,
  chain,
  value,
  onChange,
}: {
  address: string;
  chain: Chain;
  value: AddressNFT | null;
  onChange: (item: AddressNFT) => void;
}) {
  const currentValueId = value ? createNftId(value) : null;
  const { currency } = useCurrency();
  const {
    value: items,
    isLoading,
    fetchMore,
    hasNext,
  } = useAddressNfts(
    {
      address,
      chains: [chain.toString()],
      currency,
      sorted_by: 'floor_price_high',
    },
    { limit: 30, paginatedCacheMode: 'first-page', client: useDefiSdkClient() }
  );

  if (isLoading && !items?.length) {
    return <ViewLoading kind="network" />;
  }

  if (items?.length === 0) {
    return (
      <VStack gap={16} style={{ placeItems: 'center', marginTop: 200 }}>
        <span style={{ fontSize: 48, lineHeight: 1 }}>🎨</span>
        <UIText kind="headline/h2">No NFTs yet</UIText>
      </VStack>
    );
  }

  return (
    <div>
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}
      >
        {items?.map((item) => {
          const nftId = createNftId(item);
          const highlighted = nftId === currentValueId;
          const displayName = item.metadata.name || `#${item.token_id}`;
          return (
            <VStack gap={8} key={nftId}>
              <UnstyledButton
                className={classNames(
                  styles.buttonOption,
                  highlighted ? styles.highlighted : null
                )}
                style={{ position: 'relative', borderRadius: 8 }}
                onClick={() => onChange(item)}
              >
                <SquareElement
                  render={(style) => (
                    <MediaContent
                      style={{ ...style, borderRadius: 8 }}
                      content={item.metadata.content}
                      alt={`${displayName} ${
                        item.metadata.content?.type || 'image'
                      }`}
                    />
                  )}
                />
                {highlighted ? (
                  <CheckmarkCheckedIcon
                    style={{
                      position: 'absolute',
                      pointerEvents: 'none',
                      top: 4,
                      left: 4,
                      zIndex: 2,
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      color: 'var(--primary)',
                    }}
                  />
                ) : null}
              </UnstyledButton>
              <div>
                {item.collection.name ? (
                  <UIText kind="caption/regular" color="var(--neutral-500)">
                    {item.collection.name}
                  </UIText>
                ) : null}

                <UIText kind="caption/regular">{displayName}</UIText>
                {item.prices.converted &&
                item.prices.converted.floor_price > 0 ? (
                  <UIText kind="body/accent">
                    <NeutralDecimals
                      parts={formatCurrencyToParts(
                        item.prices.converted.floor_price,
                        'en',
                        item.prices.converted.currency
                      )}
                    />
                  </UIText>
                ) : null}
              </div>
            </VStack>
          );
        })}
      </div>
      {hasNext ? (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Button
            kind="regular"
            onClick={fetchMore}
            disabled={isLoading}
            style={{ paddingInline: 20 }}
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function NFTSelect({
  chain,
  address,
  value,
  onChange,
  detail,
}: {
  address: string;
  value: AddressNFT | null;
  chain: Chain;
  onChange: (id: string) => void;
  detail: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElementInterface>(null);
  const assetExistsOnChain = value && value.chain === chain.toString();
  const displayName = value
    ? value.metadata.name || `#${value.token_id}`
    : 'Select NFT';

  return (
    <>
      {createPortal(
        <BottomSheetDialog
          ref={dialogRef}
          height="90vh"
          containerStyle={{ paddingTop: 16 }}
          renderWhenOpen={() => (
            <>
              <DialogTitle
                title={<UIText kind="headline/h3">Choose NFT</UIText>}
                alignTitle="start"
              />
              <Spacer height={24} />
              <NFTList
                address={address}
                chain={chain}
                value={value}
                onChange={(item) => {
                  onChange(createNftId(item));
                  dialogRef.current?.close();
                }}
              />
            </>
          )}
        />,
        rootNode
      )}

      <Media
        image={
          value ? (
            <SquareElement
              style={{ width: 44, height: 44 }}
              render={(style) => (
                <MediaContent
                  forcePreview={true}
                  content={value.metadata.content}
                  alt={`${displayName} image`}
                  style={{
                    ...style,
                    display: 'block',
                    borderRadius: 12,
                    objectFit: 'contain',
                  }}
                />
              )}
            ></SquareElement>
          ) : (
            <svg
              viewBox="0 0 44 44"
              style={{
                display: 'block',
                width: 44,
                height: 44,
              }}
            >
              <rect width="44" height="44" rx="12" fill="var(--neutral-300)" />
            </svg>
          )
        }
        text={
          <UnstyledButton
            className="hover:color-primary"
            type="button"
            onClick={() => {
              dialogRef.current?.showModal();
            }}
          >
            <HStack gap={8} alignItems="center">
              <HStack
                gap={4}
                alignItems="center"
                style={{
                  gridTemplateColumns: 'auto',
                  textAlign: 'start',
                  fontSize:
                    (displayName.length || 0) > 11 ? '0.8em' : undefined,
                }}
              >
                <span
                  style={{
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {displayName}
                </span>
                <DownIcon
                  width={24}
                  height={24}
                  style={{
                    position: 'relative',
                    top: 2,
                    color: 'var(--primary)',
                  }}
                />
              </HStack>
              {value && chain && !assetExistsOnChain ? (
                <div
                  style={{ display: 'flex' }}
                  title="Asset is not found on selected chain"
                >
                  <ErrorIcon color="var(--negative-500)" />
                </div>
              ) : null}
            </HStack>
          </UnstyledButton>
        }
        vGap={0}
        detailText={detail}
      />
    </>
  );
}

export function NftTransferInput({
  sendView,
  address,
}: {
  sendView: SendFormView;
  address: string;
}) {
  const { nftItem } = sendView;
  const { nftAmount, nftChain } = useSelectorStore(sendView.store, [
    'nftAmount',
    'nftChain',
  ]);
  const chain = nftChain ? createChain(nftChain) : null; // TODO: update useSendForm to calculate default nft chain (using NFT Portfolio Decomposition)

  const currentItem = nftItem;
  const itemBalance = currentItem?.amount;

  const exceedsBalance = Number(nftAmount) > Number(itemBalance);
  const valueInputRef = useRef<InputHandle | null>(null);

  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useCustomValidity({
    ref: inputRef,
    customValidity: exceedsBalance
      ? 'Insufficient balance'
      : nftAmount && Number(nftAmount) < 0
      ? 'Enter a positive amount'
      : '',
  });

  const assetExistsOnChain = currentItem && currentItem.chain === nftChain;
  // This is a helper input that serves only to provide native form validation
  const readonlyInputRef = useRef<HTMLInputElement | null>(null);
  useCustomValidity({
    ref: readonlyInputRef,
    customValidity: !currentItem
      ? 'Select NFT to send'
      : !assetExistsOnChain
      ? 'Asset is not found on selected chain'
      : '',
  });

  return (
    <>
      <FormFieldset
        title="NFT"
        inputSelector={`#${CSS.escape(inputId)}`}
        startInput={
          <div>
            <ZStack>
              <input
                ref={readonlyInputRef}
                className={helperStyles.visuallyHiddenInput}
                style={{ placeSelf: 'center' }}
                type="readonly"
              />
              {chain ? (
                <NFTSelect
                  address={address}
                  chain={chain}
                  value={currentItem}
                  onChange={(id) => {
                    const { contract_address, token_id } = parseNftId(id);
                    sendView.handleChange(
                      'nftContractAddress',
                      contract_address
                    );
                    sendView.handleChange('nftId', token_id);
                  }}
                  detail={
                    currentItem ? (
                      <UIText kind="small/regular" color="var(--neutral-600)">
                        <span>Balance:</span>{' '}
                        <UnstyledButton
                          type="button"
                          style={{
                            color: exceedsBalance
                              ? 'var(--negative-500)'
                              : 'var(--primary)',
                          }}
                          disabled={itemBalance == null}
                          onClick={() => {
                            invariant(itemBalance, 'Position quantity unknown');
                            const value = itemBalance.toFixed();
                            sendView.handleChange('nftAmount', value);
                            valueInputRef.current?.setValue(value);
                          }}
                        >
                          {itemBalance ? formatTokenValue(itemBalance) : 'n/a'}
                        </UnstyledButton>
                      </UIText>
                    ) : null
                  }
                />
              ) : null}
            </ZStack>
          </div>
        }
        endInput={
          <DebouncedInput
            ref={valueInputRef}
            delay={200}
            value={nftAmount ?? ''}
            onChange={(value) => {
              sendView.handleChange('nftAmount', value);
            }}
            render={({ value, handleChange }) => (
              <UnstyledInput
                id={inputId}
                ref={inputRef}
                style={{
                  textAlign: 'end',
                  textOverflow: 'ellipsis',
                  maxWidth: 80,
                }}
                name="nftAmount"
                value={value}
                placeholder="0"
                inputMode="numeric"
                onChange={(event) => handleChange(event.target.value)}
                pattern="\d"
                required={true}
              />
            )}
          />
        }
        startDescription={null}
      />
    </>
  );
}
