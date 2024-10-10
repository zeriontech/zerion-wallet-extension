import React from 'react';
import { Button } from 'src/ui/ui-kit/Button';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import CheckIcon from 'jsx:src/ui/assets/check_double.svg';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';

interface Props {
  textToCopy: string;
  title: string;
  className?: string;
  btnStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  tooltipContent?: React.ReactNode;
  tooltipPosition?: 'right' | 'center-bottom';
  size?: number;
  buttonRef?: React.RefObject<HTMLButtonElement>;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const ICON_SIZE = 20;

export function CopyButton({
  textToCopy,
  title,
  onClick,
  className,
  btnStyle,
  style,
  tooltipPosition = 'right',
  tooltipContent,
  buttonRef,
  size = ICON_SIZE,
}: Props) {
  const { handleCopy, isSuccess } = useCopyToClipboard({ text: textToCopy });
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
        ref={buttonRef}
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
              width: size,
              height: size,
              color: 'var(--positive-500)',
            }}
          />
        ) : (
          <CopyIcon style={{ display: 'block', width: size, height: size }} />
        )}
      </Button>
      {isSuccess && tooltipContent ? (
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
          {tooltipContent}
        </div>
      ) : null}
    </div>
  );
}
