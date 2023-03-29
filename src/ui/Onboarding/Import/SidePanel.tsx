import React from 'react';
import cn from 'classnames';
import {
  animated,
  useSpring,
  config,
  useSpringRef,
  useChain,
} from 'react-spring';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import * as styles from './styles.module.css';

export function SidePanel({
  show,
  children,
  onDismiss,
}: React.PropsWithChildren<{ show: boolean; onDismiss(): void }>) {
  const panelStyleRef = useSpringRef();
  const panelStyle = useSpring({
    ref: panelStyleRef,
    config: { ...config.stiff },
    from: {
      x: 500,
    },
    to: {
      x: show ? 0 : 500,
    },
  });

  const backdropStyleRef = useSpringRef();
  const backdropStyle = useSpring({
    ref: backdropStyleRef,
    config: { ...config.stiff, duration: 150 },
    from: {
      opacity: 0,
    },
    to: {
      opacity: show ? 1 : 0,
    },
  });

  useChain(
    show ? [backdropStyleRef, panelStyleRef] : [panelStyleRef, backdropStyleRef]
  );

  return (
    <>
      {show ? (
        <KeyboardShortcut
          combination="esc"
          onKeyDown={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
        />
      ) : null}
      <animated.div
        className={cn(styles.sidePanelBackdrop, { [styles.show]: show })}
        style={backdropStyle}
        onClick={onDismiss}
      >
        <animated.div
          className={styles.sidePanel}
          style={panelStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {show ? (
            <UnstyledButton
              autoFocus={true}
              className={styles.sidePanelCloseButton}
              onClick={onDismiss}
            >
              <CloseIcon style={{ width: 20, height: 20 }} />
            </UnstyledButton>
          ) : null}
          {children}
        </animated.div>
      </animated.div>
    </>
  );
}
