import React from 'react';
import { Button } from 'src/ui/ui-kit/Button';

export function DialogTitle({
  title,
  alignTitle = 'center',
}: {
  title: React.ReactNode;
  alignTitle?: 'start' | 'center';
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          alignTitle === 'center' ? '1fr 4fr 1fr' : 'max-content 1fr',
      }}
    >
      <div
        style={{
          gridColumnStart: alignTitle === 'center' ? 2 : 1,
          placeSelf: 'center',
        }}
      >
        {title}
      </div>
      <form method="dialog" style={{ placeSelf: 'end' }}>
        <Button
          value="cancel"
          kind="ghost"
          size={32}
          aria-label="Close"
          style={{ color: 'var(--primary)', fontWeight: 400 }}
        >
          Close
        </Button>
      </form>
    </div>
  );
}
