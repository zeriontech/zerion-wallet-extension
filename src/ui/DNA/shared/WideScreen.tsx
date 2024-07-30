import React from 'react';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import ArrowLeftIcon from 'jsx:src/ui/assets/arrow-left.svg';
import ArrowRightIcon from 'jsx:src/ui/assets/arrow-right.svg';
import * as styles from './styles.module.css';

function WideScreenProtector() {
  return (
    <div
      className={styles.container}
      style={{ height: 600, zIndex: 10, paddingTop: 64, alignItems: 'center' }}
    >
      <UIText kind="headline/hero" style={{ textAlign: 'center' }}>
        Please, enlarge
        <br />
        your browser window
      </UIText>
      <UIText
        kind="caption/regular"
        color="var(--neutral-500)"
        style={{
          position: 'absolute',
          bottom: 12,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        Our developer will be back from his vacation soon.
        <br />
        We will definitely make him pay for this!
      </UIText>
      <div
        style={{ position: 'absolute', left: 24, top: 'calc(50% - 20px)' }}
        className={styles.leftArrow}
      >
        <ArrowLeftIcon style={{ width: 40, height: 40 }} />
      </div>
      <div
        style={{ position: 'absolute', right: 24, top: 'calc(50% - 20px)' }}
        className={styles.rightArrow}
      >
        <ArrowRightIcon style={{ width: 40, height: 40 }} />
      </div>
    </div>
  );
}

export function WideScreen({ children }: React.PropsWithChildren) {
  const { innerWidth } = useWindowSizeStore();

  return (
    <ZStack>
      {innerWidth < 800 ? <WideScreenProtector /> : null}
      {children}
    </ZStack>
  );
}
