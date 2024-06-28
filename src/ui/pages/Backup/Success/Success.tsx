import React, { useEffect, useRef } from 'react';
import cn from 'classnames';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import coinImgSrc from 'src/ui/assets/zer_coin.png';
import sparkImgSrc from 'src/ui/assets/zer_spark.png';
import starImgSrc from 'src/ui/assets/zer_star.png';
import * as styles from './styles.module.css';

export function Success() {
  const { isNarrowView } = useWindowSizeStore();
  const coinRef = useRef<HTMLButtonElement | null>(null);
  const starRef = useRef<HTMLButtonElement | null>(null);
  const sparkRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      const xShift = (-10 * event.pageX) / window.innerWidth;
      const yShift = (-10 * event.pageY) / window.innerHeight;
      const newTransformProperty = `translate(${xShift}px, ${yShift}px)`;
      coinRef.current?.style.setProperty('transform', newTransformProperty);
      starRef.current?.style.setProperty('transform', newTransformProperty);
      sparkRef.current?.style.setProperty('transform', newTransformProperty);
    };
    document.addEventListener('mousemove', handleMove);
    return () => document.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <>
      <VStack gap={24}>
        <div className={styles.container}>
          <VStack gap={24}>
            <div className={styles.title}>
              Nicely Done
              <br />
              Self-Custodial Human!
            </div>
            <UIText kind="headline/h3" color="var(--always-white)">
              Zerion makes exploring web3 feel better than ever.
              {isNarrowView ? ' ' : <br />}
              You can close this tab now.
            </UIText>
          </VStack>
          {isNarrowView ? null : (
            <>
              <div className={cn(styles.decoration, styles.coinDecoration)}>
                <img src={coinImgSrc} width={120} height={120} />
              </div>
              <div className={cn(styles.decoration, styles.starDecoration)}>
                <img src={starImgSrc} width={80} height={80} />
              </div>
              <div className={cn(styles.decoration, styles.sparkDecoration)}>
                <img src={sparkImgSrc} width={60} height={60} />
              </div>
            </>
          )}
        </div>
      </VStack>
    </>
  );
}
