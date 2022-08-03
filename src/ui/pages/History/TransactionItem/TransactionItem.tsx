import { capitalize } from 'capitalize-ts';
import React from 'react';
import type { PartialAddressTransaction } from 'src/modules/ethereum/transactions/model';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { Media } from 'src/ui/ui-kit/Media';
import { UIText } from 'src/ui/ui-kit/UIText';

function TransactionIcon({
  addressTransaction,
}: {
  addressTransaction: PartialAddressTransaction;
}) {
  const { meta, changes } = addressTransaction;
  const url =
    meta.asset?.icon_url ||
    changes[0]?.asset.icon_url ||
    changes[0]?.nft_asset?.asset?.preview.url;
  const symbol = meta.asset?.symbol || changes[0]?.asset.symbol;
  const isNftIcon = changes[0]?.nft_asset?.asset?.preview.url;
  if (url) {
    return (
      <img
        style={isNftIcon ? { borderRadius: 4 } : undefined}
        width="24"
        height="24"
        src={url}
        alt=""
      />
    );
  } else {
    return (
      <UIText
        kind="label/reg"
        style={{
          borderRadius: '50%',
          width: 24,
          height: 24,
          backgroundColor: 'var(--neutral-300)',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 9,
          cursor: 'default',
        }}
      >
        {symbol?.slice(0, 3).toUpperCase() ?? '?'}
      </UIText>
    );
  }
}

export function TransactionItem({
  addressTransaction,
}: {
  addressTransaction: PartialAddressTransaction;
}) {
  const { networks } = useNetworks();
  if (!networks) {
    return null;
  }
  const { status, mined_at, hash, meta, type } = addressTransaction;
  const isMined = status !== 'pending';
  return (
    <Media
      vGap={0}
      image={
        <div style={{ position: 'relative' }}>
          {isMined ? null : (
            <CircleSpinner
              size="26px"
              trackWidth="7%"
              color="var(--primary)"
              style={{
                position: 'absolute',
                top: -1,
                left: -1,
              }}
            />
          )}
          <TransactionIcon addressTransaction={addressTransaction} />
        </div>
      }
      text={
        <UIText kind="body/s_med">{meta.action ?? capitalize(type)}</UIText>
      }
      detailText={
        <UIText kind="body/s_reg" color="var(--neutral-500)">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={networks.getExplorerTxUrlById(
              addressTransaction.chain_id || '0x1',
              hash
            )}
            style={{
              color: 'inherit',
            }}
          >
            <span title={hash}>{truncateAddress(hash, 6)}</span>
          </a>
          {' · '}
          <span>
            {new Intl.DateTimeFormat('en', {
              hour: 'numeric',
              minute: 'numeric',
            }).format(mined_at * 1000)}
          </span>
        </UIText>
      }
    />
  );
}
