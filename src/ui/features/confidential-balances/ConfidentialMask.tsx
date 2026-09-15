import React from 'react';
import LockIcon from 'jsx:src/ui/assets/lock-outline.svg';
import { HiddenBalancePixels } from 'src/ui/components/BlurrableBalance';
import type { UITextProps } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { ConfidentialInfoHovercard } from './ConfidentialInfoHovercard';
import { openRevealDialog } from './revealDialogStore';

const LOCK_SIZE: Record<UITextProps['kind'], number> = {
  'headline/hero': 24,
  'headline/h1': 20,
  'headline/h2': 18,
  'headline/h3': 16,
  'body/accent': 14,
  'body/regular': 14,
  'small/accent': 12,
  'small/regular': 12,
  'caption/accent': 10,
  'caption/regular': 10,
};

/**
 * The placeholder for an encrypted amount: the hide-balances pixel grid plus
 * a small lock. Hovering it shows the explainer card; tapping it opens the
 * Reveal Dialog for the wallet the amount belongs to (the current address
 * unless told otherwise); rows are links, so the tap is stopped from bubbling.
 */
export function ConfidentialMask({
  kind,
  color,
  address,
  interactive = true,
  style,
}: {
  kind: UITextProps['kind'];
  color?: string;
  /** Owner of the amount; defaults to the current address */
  address?: string | null;
  /** `false` inside the Reveal Dialog itself, where the tap has nowhere to go */
  interactive?: boolean;
  style?: React.CSSProperties;
}) {
  const { singleAddress } = useAddressParams();
  const targetAddress = address || singleAddress;
  const lockSize = LOCK_SIZE[kind];
  const content = (
    <>
      <LockIcon
        style={{
          display: 'block',
          width: lockSize,
          height: lockSize,
          color: color || 'var(--neutral-500)',
          flexShrink: 0,
        }}
      />
      <HiddenBalancePixels
        kind={kind}
        color={color}
        label="Encrypted balance"
      />
    </>
  );
  const layoutStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    verticalAlign: 'middle',
    ...style,
  };
  if (!interactive) {
    return (
      <span title="Encrypted balance" style={layoutStyle}>
        {content}
      </span>
    );
  }
  return (
    // The anchor needs a box of its own to position against (`display:
    // contents` would measure as a zero rect), so it hugs the mask inline.
    <ConfidentialInfoHovercard
      placement="bottom-start"
      anchorStyle={{
        display: 'inline-flex',
        alignItems: 'center',
        verticalAlign: 'middle',
      }}
    >
      <UnstyledButton
        type="button"
        aria-label="Encrypted balance — reveal"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (targetAddress) {
            openRevealDialog({ address: targetAddress, trigger: 'value' });
          }
        }}
        style={{ ...layoutStyle, cursor: 'pointer' }}
      >
        {content}
      </UnstyledButton>
    </ConfidentialInfoHovercard>
  );
}

/** Small lock rendered after an encrypted position's name */
export function ConfidentialNameLock({ size = 14 }: { size?: number }) {
  return (
    <span title="Encrypted on-chain" style={{ display: 'inline-flex' }}>
      <LockIcon
        style={{
          display: 'block',
          width: size,
          height: size,
          color: 'var(--neutral-500)',
        }}
      />
    </span>
  );
}
