import React from 'react';
import { Button } from 'src/ui/ui-kit/Button';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';

interface Props {
  address: string;
  title?: string;
}

export function CopyButton({ address, title = 'Copy Address' }: Props) {
  const { handleCopy, isSuccess } = useCopyToClipboard({ text: address });
  return (
    <div style={{ position: 'relative' }}>
      <Button kind="ghost" size={32} title={title} onClick={handleCopy}>
        {isSuccess ? (
          <div style={{ width: 20, height: 20, color: 'var(--positive-500)' }}>
            ✔
          </div>
        ) : (
          <CopyIcon style={{ display: 'block', width: 20, height: 20 }} />
        )}
      </Button>
      {isSuccess ? (
        <div
          style={{
            pointerEvents: 'none',
            backgroundColor: 'var(--z-index-1)',
            boxShadow: 'var(--elevation-200)',
            position: 'absolute',
            bottom: -36,
            left: -18,
            padding: 8,
            borderRadius: 4,
          }}
        >
          Copied!
        </div>
      ) : null}
    </div>
  );
}
