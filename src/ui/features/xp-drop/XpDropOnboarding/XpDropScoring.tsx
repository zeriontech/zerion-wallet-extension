import React, { useEffect, useState } from 'react';
import { animated, useTransition } from '@react-spring/web';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { useNavigate } from 'react-router-dom';
import CheckmarkCheckedIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import * as styles from './styles.module.css';

function ProgressCounter({ counter }: { counter: number }) {
  return (
    <div className={styles.progressCounter}>
      {counter > 5 ? (
        <CheckmarkCheckedIcon
          style={{
            width: 56,
            height: 56,
            color: 'var(--positive-500)',
          }}
        />
      ) : (
        <>
          <CircleSpinner size="56px" trackColor="var(--always-white)" />
          <UIText kind="headline/h2" className={styles.progressCounterValue}>
            {counter}
          </UIText>
        </>
      )}
    </div>
  );
}

function CriteriaListItem({
  image,
  text,
}: {
  image: React.ReactNode;
  text: React.ReactNode;
}) {
  return (
    <HStack gap={16} alignItems="center" className={styles.criteriaItem}>
      <div className={styles.criteriaImage}>{image}</div>
      <UIText kind="body/accent">{text}</UIText>
    </HStack>
  );
}

const criteriaItems = [
  <CriteriaListItem image="🚀" text="Multichain Profile" />,
  <CriteriaListItem image="💬" text="Social & NFT Activity" />,
  <CriteriaListItem image="🦸" text="Zerion OG" />,
  <CriteriaListItem image="🧭" text="Days Onchain" />,
  <CriteriaListItem image="💎" text="Zerion DNA Holder" />,
  <CriteriaListItem image="💸" text="Gas Spent" />,
];

export function XpDropScoring() {
  const navigate = useNavigate();
  const [counter, setCounter] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((value) => value + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (counter > 6) {
      navigate('/xp-drop/claim');
    }
  });

  const visibleItems = criteriaItems
    .slice(counter)
    .map((item, index) => ({ item, key: index }));

  const transitions = useTransition(visibleItems, {
    keys: (item) => item.key,
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });

  return (
    <PageColumn>
      <NavigationTitle title={null} documentTitle="Checking Criteria" />
      <PageTop />
      <VStack gap={24}>
        <ProgressCounter counter={counter} />
        <VStack gap={0}>
          <UIText kind="headline/hero">Checking Criteria</UIText>
          <UIText kind="headline/h3" color="var(--neutral-500)">
            Lets check what your wallet is about
          </UIText>
        </VStack>
        <VStack gap={12}>
          {transitions((style, { item, key }) => (
            <animated.div style={style} key={key}>
              {item}
            </animated.div>
          ))}
        </VStack>
      </VStack>
    </PageColumn>
  );
}
