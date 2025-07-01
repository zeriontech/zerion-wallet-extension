import React from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { BackButton } from 'src/ui/components/BackButton';
import { useGoBack } from 'src/ui/shared/navigation/useGoBack';

export function NavigationBar({
  title,
  home,
}: {
  title: string;
  home?: string;
}) {
  const goBack = useGoBack(home);
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
        gridTemplateColumns: '36px 1fr 40px',
      }}
    >
      <BackButton onClick={goBack} />
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
      <KeyboardShortcut combination="backspace" onKeyDown={goBack} />
    </nav>
  );
}
