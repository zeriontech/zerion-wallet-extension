import React from 'react';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import type { ToasterView } from '../types';
import * as s from './styles.module.css';

export function ToasterIcons({ view }: { view: ToasterView | undefined }) {
  if (!view) {
    return (
      <div className={s.iconSlot}>
        <div className={s.spinnerCenter}>
          <CircleSpinner size="20px" />
        </div>
      </div>
    );
  }

  if (view.kind === 'approve') {
    return (
      <div className={s.iconSlot}>
        <div className={s.iconSingle}>
          <TokenIcon
            src={view.token.iconUrl ?? undefined}
            symbol={view.token.symbol}
            size={32}
          />
        </div>
        <div className={s.chainBadge}>
          <NetworkIcon src={view.chain.iconUrl} name={null} size={12} />
        </div>
      </div>
    );
  }

  if (view.kind === 'send') {
    return (
      <div className={s.iconSlot}>
        <div
          className={s.iconBack}
          style={view.isNft ? { borderRadius: 6 } : undefined}
        >
          <TokenIcon
            src={view.token.iconUrl ?? undefined}
            symbol={view.token.symbol}
            size={28}
          />
        </div>
        <div className={s.iconFront} style={{ borderRadius: 6 }}>
          <WalletAvatar
            address={view.recipient.address}
            size={26}
            borderRadius={6}
            disablePremiumHighlight
          />
        </div>
        <div className={s.chainBadgeFront}>
          <NetworkIcon src={view.chain.iconUrl} name={null} size={14} />
        </div>
      </div>
    );
  }

  // swap | bridge
  return (
    <div className={s.iconSlot}>
      <div className={s.iconBack}>
        <TokenIcon
          src={view.sent.iconUrl ?? undefined}
          symbol={view.sent.symbol}
          size={25}
        />
      </div>
      <div className={s.iconFront}>
        <TokenIcon
          src={view.received.iconUrl ?? undefined}
          symbol={view.received.symbol}
          size={25}
        />
      </div>
      <div className={s.chainBadgeFront}>
        <NetworkIcon src={view.receivedChain.iconUrl} name={null} size={12} />
      </div>
    </div>
  );
}
