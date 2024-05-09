import React from 'react';
import { Button } from 'src/ui/ui-kit/Button';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import CheckIcon from 'jsx:src/ui/assets/check_double.svg';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';

interface Props {
  address: string;
  title?: string;
  className?: string;
  btnStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  tooltipPosition?: 'right' | 'center-bottom';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const ICON_SIZE = 20;

export function CopyButton({
  address,
  title = 'Copy Address',
  onClick,
  className,
  btnStyle,
  style,
  tooltipPosition = 'right',
}: Props) {
  const { handleCopy, isSuccess } = useCopyToClipboard({ text: address });
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        verticalAlign: 'bottom',
        ...style,
      }}
    >
      <Button
        kind="text-primary"
        size={36}
        title={title}
        onClick={(event) => {
          onClick?.(event);
          handleCopy();
        }}
        style={{
          ['--button-text-hover' as string]: 'var(--neutral-800)',
          padding: 8,
          ...btnStyle,
        }}
      >
        {isSuccess ? (
          <CheckIcon
            style={{
              display: 'block',
              width: ICON_SIZE,
              height: ICON_SIZE,
              color: 'var(--positive-500)',
            }}
          />
        ) : (
          <CopyIcon
            style={{ display: 'block', width: ICON_SIZE, height: ICON_SIZE }}
          />
        )}
      </Button>
      {isSuccess ? (
        <div
          style={{
            pointerEvents: 'none',
            backgroundColor: 'var(--black)',
            color: 'var(--white)',
            boxShadow: 'var(--elevation-200)',
            position: 'absolute',
            padding: '4px 8px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
            top: tooltipPosition === 'center-bottom' ? undefined : 2,
            bottom: tooltipPosition === 'center-bottom' ? -32 : undefined,
            right: tooltipPosition === 'center-bottom' ? undefined : 0,
            left: tooltipPosition === 'center-bottom' ? 10 : undefined,
            transform:
              tooltipPosition === 'center-bottom'
                ? 'translateX(-50%)'
                : 'translateX(100%)',
          }}
        >
          Address Copied
        </div>
      ) : null}
    </div>
  );
}
