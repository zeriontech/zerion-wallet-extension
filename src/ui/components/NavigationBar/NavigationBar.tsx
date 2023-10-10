import React from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useNavigate } from 'react-router-dom';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { BackButton } from 'src/ui/components/BackButton';

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
      <KeyboardShortcut
        combination="backspace"
        onKeyDown={() => navigate(-1)}
      />
    </nav>
  );
}
