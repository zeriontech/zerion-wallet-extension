import React from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import SolanaIcon from 'jsx:src/ui/assets/solana.svg';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';

export function SolanaBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <VStack
      gap={4}
      style={{
        position: 'relative',
        padding: '12px 16px',
        width: '100%',
        borderRadius: 20,
        background: 'linear-gradient(94deg, #B0FEEB 0%, #D8C2FF 100%)',
      }}
    >
      <img
        style={{ position: 'absolute', right: 0, top: 0, height: 108 }}
        alt="Solana banner decoration"
        src="https://cdn.zerion.io/images/dna-assets/solana-banner-decoration.png"
        srcSet="https://cdn.zerion.io/images/dna-assets/solana-banner-decoration.png, https://cdn.zerion.io/images/dna-assets/solana-banner-decoration_2x.png 2x"
      />
      <UnstyledButton
        onClick={onDismiss}
        aria-label="close"
        style={{
          color: 'var(--always-white)',
          position: 'absolute',
          top: 12,
          right: 12,
          width: 16,
          height: 16,
        }}
      >
        <CloseIcon style={{ width: 16, height: 16 }} />
      </UnstyledButton>{' '}
      <div style={{ padding: '5px 2px', display: 'flex' }}>
        <SolanaIcon
          style={{ width: 28, height: 22, color: 'var(--always-black)' }}
        />
      </div>
      <UIText kind="headline/h3" color="var(--always-black)">
        Solana & Zerion
      </UIText>
      <UIText
        kind="small/regular"
        color="var(--always-black)"
        style={{ position: 'relative' }}
      >
        Zerion supports Solana wow
      </UIText>
    </VStack>
  );
}
