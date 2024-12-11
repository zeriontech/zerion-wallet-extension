import React from 'react';
import { Content } from 'react-area';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { hideBalancesStore } from './store';

export function HideBalancesFeature() {
  return (
    <>
      <Content name="global-keyboard-shortcuts">
        <KeyboardShortcut
          combination="shift+h"
          onKeyDown={() => {
            hideBalancesStore.nextMode();
          }}
        />
        <KeyboardShortcut
          combination="shift+j"
          onKeyDown={() => {
            hideBalancesStore.nextTemporary();
          }}
        />
      </Content>
    </>
  );
}
