import React from 'react';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import IconLeft from 'jsx:src/ui/assets/arrow-left.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useNavigate } from 'react-router-dom';

function BackButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <UnstyledButton
      aria-label="Go back"
      style={{ padding: '8px 0' }}
      {...props}
    >
      <IconLeft role="presentation" style={{ display: 'block' }} />
    </UnstyledButton>
  );
}

export function NavigationBar({ title }: { title: string }) {
  const navigate = useNavigate();
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1,
        backgroundColor: 'var(--background)',
        paddingTop: 8,
        display: 'grid',
        alignItems: 'center',
        gridTemplateColumns: '40px 1fr 40px',
      }}
    >
      <BackButton onClick={() => navigate(-1)} />
      <UIText
        kind="body/accent"
        style={{
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </UIText>
    </nav>
  );
}
