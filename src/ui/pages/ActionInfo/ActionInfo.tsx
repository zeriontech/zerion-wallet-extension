import { capitalize } from 'capitalize-ts';
import React, { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type {
  AddressAction,
  ActionDirection,
  Amount,
  Collection,
  NFTPreview,
} from 'src/modules/zerion-api/requests/wallet-get-actions';
import { invariant } from 'src/shared/invariant';
import { isNumeric } from 'src/shared/isNumeric';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { isInteractiveElement } from 'src/ui/shared/isInteractiveElement';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { minus } from 'src/ui/shared/typography';
import { AssetLink } from 'src/ui/components/AssetLink';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import { NFTLink } from 'src/ui/components/NFTLink';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import { RateLine } from './RateLine';
import { LabelLine } from './LabelLine';
import { FeeLine } from './FeeLine';
import { ExplorerInfo } from './ExplorerInfo';
import * as styles from './styles.module.css';

const dateFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function AssetContent({
  fungible,
  nft,
  collection,
  direction,
  amount,
  unlimited,
}: {
  fungible: Fungible | null;
  nft: NFTPreview | null;
  collection: Collection | null;
  direction: ActionDirection | null;
  amount: Amount | null;
  unlimited?: boolean;
}) {
  if (fungible) {
    return (
      <HStack
        gap={12}
        alignItems="center"
        style={{ position: 'relative', height: 44 }}
      >
        <TokenIcon size={36} src={fungible.iconUrl} symbol={fungible.symbol} />
        <VStack gap={0}>
          <UIText
            kind="headline/h3"
            color={direction === 'in' ? 'var(--positive-500)' : undefined}
          >
            <HStack
              gap={4}
              alignItems="center"
              style={{ gridTemplateColumns: 'auto 1fr' }}
            >
              <span>
                {unlimited
                  ? 'Unlimited'
                  : amount?.quantity
                  ? `${
                      direction === 'out'
                        ? minus
                        : direction === 'in'
                        ? '+'
                        : ''
                    }${formatTokenValue(amount?.quantity || '0', '')}`
                  : null}
              </span>
              <AssetLink
                fungible={fungible}
                title={direction == null ? fungible.name : undefined}
              />
            </HStack>
          </UIText>
          {direction != null ? (
            <UIText kind="small/regular" color="var(--neutral-500)">
              {amount?.value != null
                ? formatPriceValue(amount.value || '0', 'en', amount.currency)
                : 'N/A'}
            </UIText>
          ) : null}
        </VStack>
      </HStack>
    );
  }

  if (nft) {
    return (
      <HStack gap={12} alignItems="center" style={{ height: 44 }}>
        <TokenIcon
          size={36}
          src={nft.metadata?.content?.imagePreviewUrl}
          symbol={nft.metadata?.name || 'NFT'}
        />
        <VStack gap={0}>
          <UIText kind="headline/h3">
            <HStack
              gap={4}
              alignItems="center"
              style={{ gridTemplateColumns: 'auto 1fr' }}
            >
              <span>
                {amount?.quantity
                  ? `${
                      direction === 'out'
                        ? minus
                        : direction === 'in'
                        ? '+'
                        : ''
                    }${formatTokenValue(amount?.quantity || '0', '')}`
                  : null}
              </span>
              <NFTLink nft={nft} />
            </HStack>
          </UIText>
          <UIText kind="small/regular" color="var(--neutral-500)">
            {direction != null ? (
              <UIText kind="small/regular" color="var(--neutral-500)">
                {amount?.value != null
                  ? formatPriceValue(amount.value || '0', 'en', amount.currency)
                  : 'N/A'}
              </UIText>
            ) : null}
          </UIText>
        </VStack>
      </HStack>
    );
  }

  if (collection) {
    return (
      <HStack gap={12} alignItems="center" style={{ height: 44 }}>
        <TokenIcon
          size={36}
          src={collection.iconUrl}
          symbol={collection.name || 'Collection'}
        />
        <UIText kind="headline/h3">{collection.name}</UIText>
      </HStack>
    );
  }
}

function TransferDivider() {
  return (
    <div
      style={{
        height: 16,
        width: 'calc(100% + 32px)',
        left: -16,
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 4,
          left: 4,
          right: 4,
          height: 1,
          backgroundColor: 'var(--neutral-300)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: -1,
          left: '50%',
          transformOrigin: 'center',
          transform: 'translateX(-50%) rotate(45deg)',
          width: 12,
          height: 12,
          borderRight: '1px solid var(--neutral-300)',
          borderBottom: '1px solid var(--neutral-300)',
          backgroundColor: 'var(--z-index-1)',
        }}
      />
    </div>
  );
}

function ActContent({
  act,
  showActType,
}: {
  act: NonNullable<AddressAction['acts']>[number];
  showActType: boolean;
}) {
  const approvals = act.content?.approvals;
  const incomingTransfers = useMemo(
    () =>
      act.content?.transfers?.filter((transfer) => transfer.direction === 'in'),
    [act.content?.transfers]
  );
  const outgoingTransfers = useMemo(
    () =>
      act.content?.transfers?.filter(
        (transfer) => transfer.direction === 'out'
      ),
    [act.content?.transfers]
  );

  return (
    <div
      style={{
        borderRadius: 12,
        padding: '8px 12px',
        backgroundColor: 'var(--z-index-1)',
      }}
    >
      {showActType ? (
        <UIText
          kind="small/accent"
          color="var(--neutral-500)"
          style={{ paddingBottom: 4 }}
        >
          {act.type.displayValue}
        </UIText>
      ) : null}
      {approvals?.length ? (
        <VStack gap={4}>
          {showActType ? null : (
            <UIText kind="small/accent" color="var(--neutral-500)">
              Allow to spend
            </UIText>
          )}
          {approvals.map((approval, index) => (
            <AssetContent
              key={index}
              amount={approval.amount}
              unlimited={approval.unlimited}
              direction={null}
              fungible={approval.fungible}
              collection={approval.collection}
              nft={approval.nft}
            />
          ))}
        </VStack>
      ) : null}
      {outgoingTransfers?.length ? (
        <VStack gap={4}>
          {showActType ? null : (
            <UIText kind="small/accent" color="var(--neutral-500)">
              Sent
            </UIText>
          )}
          {outgoingTransfers.map((transfer, index) => (
            <AssetContent
              key={index}
              amount={transfer.amount}
              unlimited={false}
              direction={transfer.direction}
              fungible={transfer.fungible}
              collection={null}
              nft={transfer.nft}
            />
          ))}
        </VStack>
      ) : null}
      {outgoingTransfers?.length && incomingTransfers?.length ? (
        <TransferDivider />
      ) : null}
      {incomingTransfers?.length ? (
        <VStack gap={4}>
          {showActType ? null : (
            <UIText kind="small/accent" color="var(--neutral-500)">
              Received
            </UIText>
          )}
          {incomingTransfers.map((transfer, index) => (
            <AssetContent
              key={index}
              amount={transfer.amount}
              unlimited={false}
              direction={transfer.direction}
              fungible={transfer.fungible}
              collection={null}
              nft={transfer.nft}
            />
          ))}
        </VStack>
      ) : null}
    </div>
  );
}

export function ActionInfo() {
  const navigate = useNavigate();
  const { act_index } = useParams();
  const { state } = useLocation();

  invariant(
    !act_index || isNumeric(act_index),
    'actIndex should be a number or be empty'
  );
  const actIndex = act_index ? Number(act_index) : undefined;
  const addressAction = state?.addressAction as AddressAction | undefined;
  const targetObject =
    actIndex != null ? addressAction?.acts?.at(actIndex) : addressAction;

  const actionDate = useMemo(() => {
    return addressAction?.timestamp
      ? dateFormatter.format(new Date(addressAction.timestamp))
      : null;
  }, [addressAction?.timestamp]);

  if (!addressAction || !targetObject) {
    return (
      <PageColumn>
        Sorry, action not found. Please, go back and select it from the history
        again.
      </PageColumn>
    );
  }

  const { type, status, label, transaction } = targetObject;
  const isFailed = status === 'failed' || status === 'dropped';

  return (
    <PageColumn>
      <NavigationTitle
        title={
          <VStack style={{ justifyItems: 'center' }} gap={0}>
            <UIText kind="body/accent">{`${type.displayValue}${
              isFailed ? ` (${capitalize(status)})` : ''
            }`}</UIText>
            <UIText kind="small/regular" color="var(--neutral-500)">
              {actionDate}
            </UIText>
          </VStack>
        }
        documentTitle="Action info"
      />
      <VStack gap={16} style={{ marginTop: 16 }}>
        <VStack gap={8}>
          {actIndex != null && addressAction?.acts?.at(actIndex) ? (
            <ActContent
              act={addressAction.acts[actIndex]}
              showActType={false}
            />
          ) : addressAction.acts?.length === 1 ? (
            <ActContent act={addressAction.acts[0]} showActType={false} />
          ) : (
            addressAction?.acts?.map((act, index) => (
              <div
                key={index}
                className={styles.act}
                onClick={(event) => {
                  if (isInteractiveElement(event.target)) {
                    return;
                  }
                  navigate(`/action/${addressAction.id}/${index}`, {
                    state: { addressAction },
                  });
                }}
              >
                <UnstyledButton
                  className={styles.actBackdrop}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/action/${addressAction.id}/${index}`, {
                      state: { addressAction },
                    });
                  }}
                />
                <ActContent act={act} showActType={true} />
                <ChevronRightIcon className={styles.actArrow} />
              </div>
            ))
          )}
        </VStack>
        <VStack
          gap={20}
          style={{
            backgroundColor: 'var(--z-index-1)',
            padding: 16,
            borderRadius: 12,
          }}
        >
          {transaction ? <ExplorerInfo transaction={transaction} /> : null}
          {label ? <LabelLine label={label} /> : null}
          {'rate' in targetObject && targetObject.rate ? (
            <RateLine rate={targetObject.rate} />
          ) : null}
          {addressAction.fee ? <FeeLine fee={addressAction.fee} /> : null}
        </VStack>
      </VStack>
    </PageColumn>
  );
}
