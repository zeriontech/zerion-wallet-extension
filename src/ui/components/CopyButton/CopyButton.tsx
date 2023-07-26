import React from 'react';
import { Button } from 'src/ui/ui-kit/Button';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import CheckIcon from 'jsx:src/ui/assets/check_double.svg';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';

interface Props {
  address: string;
  title?: string;
}

const ICON_SIZE = 24;

export function CopyButton({ address, title = 'Copy Address' }: Props) {
  const { handleCopy, isSuccess } = useCopyToClipboard({ text: address });
  return (
    <div style={{ position: 'relative' }}>
      <Button
        kind="ghost"
        size={40}
        title={title}
        onClick={handleCopy}
        style={{ width: 40, padding: 8 }}
      >
        {isSuccess ? (
          <CheckIcon
            style={{
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
            bottom: -32,
            left: -36,
            padding: '4px 8px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
          }}
        >
          Address Copied
        </div>
      ) : null}
    </div>
  );
}
