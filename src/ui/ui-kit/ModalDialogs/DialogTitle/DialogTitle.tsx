import React from 'react';
import { Button } from 'src/ui/ui-kit/Button';

export function DialogTitle({ title }: { title: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 4fr 1fr',
      }}
    >
      <div style={{ gridColumnStart: 2, placeSelf: 'center' }}>{title}</div>
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
