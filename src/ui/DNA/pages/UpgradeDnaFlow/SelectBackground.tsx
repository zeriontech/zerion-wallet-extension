import React, { useCallback, useState } from 'react';
import cn from 'classnames';
import {
  useSpring,
  useSpringRef,
  animated,
  useTrail,
  useChain,
  useSprings,
} from '@react-spring/web';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import ExplusiveIcon from 'jsx:src/ui/DNA/assets/exclusive.svg';
import { Button } from 'src/ui/ui-kit/Button';
import { invariant } from 'src/shared/invariant';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import BackgroundImg1 from '../../assets/self-custodial.png';
import BackgroundImg2 from '../../assets/seek-alpha.png';
import BackgroundImg3 from '../../assets/dont-be-maxi.png';
import BackgroundImg4 from '../../assets/be-invested.png';
import BackgroundImg5 from '../../assets/its-all-on-chain.png';
import { Step } from '../../shared/Step';
import * as helpersStyles from '../../shared/styles.module.css';
import * as styles from './styles.module.css';
import { VALUE_INDEX, VALUE_TEXTS, type Value } from './values';

const VALUE_ORDER: Value[] = [
  'self-custodial',
  'seek-alpha',
  'dont-be-maxi',
  'be-invested',
  'its-all-on-chain',
];

const IMAGES = [
  BackgroundImg1,
  BackgroundImg2,
  BackgroundImg3,
  BackgroundImg4,
  BackgroundImg5,
];

type Step = 'preview' | 'select';

function SelectBackgroundContent() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const showSteps = Boolean(params.get('steps'));
  const address = params.get('address');
  invariant(address, 'address should exist in search params');
  const [selectedValue, setSelectedValue] = useState<Value>('self-custodial');
  const [fillBackground, setFillBackground] = useState(false);

  const [step, setStep] = useState<Step>('preview');

  const backgroundContainerStyle = useSpring({
    transform:
      step === 'preview' ? 'rotate(45deg) scale(1.5)' : 'rotate(0deg) scale(1)',
    config: {
      tension: 80,
      friction: 20,
    },
  });

  const handleSelect = useCallback(() => {
    setFillBackground(true);
    setTimeout(
      () =>
        navigate(`/upgrade-dna/sign?address=${address}&value=${selectedValue}`),
      800
    );
    return null;
  }, [address, selectedValue, navigate]);

  const contentAppearRef = useSpringRef();
  const contentAppearStyle = useSpring({
    ref: contentAppearRef,
    from: { opacity: 0, y: -20 },
    to: { opacity: 1, y: 0 },
    config: {
      tension: 80,
      friction: 25,
    },
  });

  const backgroundStyleApi = useSpringRef();
  const [backgroundStyle] = useSprings(5, (index) => {
    return {
      ref: backgroundStyleApi,
      transform: `rotate(${-16 * index}deg) scale(${
        1 - index * 0.125
      }) translateY(0px)`,
      config: {
        tension: 80,
        friction: 30,
      },
    };
  });

  const updateAnimation = useCallback(
    (currentValue: Value) => {
      backgroundStyleApi.start((index: number) => {
        const position = index - VALUE_INDEX[currentValue];
        return {
          transform: `rotate(${
            position >= 0 ? -16 * position : -20 * position
          }deg) scale(${Math.min(1, 1 - position * 0.125)}) translateY(${
            position >= 0 ? '0px' : '300px'
          })`,
        };
      });
    },
    [backgroundStyleApi]
  );

  const backgroundAppearRef = useSpringRef();
  const backgroundAppearStyle = useTrail(5, {
    ref: backgroundAppearRef,
    from: {
      transform: 'scale(0.8) rotate(-20deg)',
    },
    to: { transform: 'scale(1) rotate(0)' },
    config: {
      tension: 200,
      friction: 10,
    },
  });

  useChain([backgroundAppearRef, contentAppearRef], [0, 0.4]);

  return (
    <>
      {showSteps ? (
        <HStack gap={4} className={helpersStyles.steps} justifyContent="center">
          <Step active={false} />
          <Step active={false} />
          <Step active={true} />
          <Step active={false} />
        </HStack>
      ) : null}
      <div style={{ position: 'absolute', left: 0, top: 0 }}>
        <animated.div
          style={{
            ...backgroundContainerStyle,
            transformOrigin: '130px 150px',
          }}
        >
          {VALUE_ORDER.map((value, index) => (
            <div
              key={value}
              className={cn(
                styles.backgroundImageContainer,
                fillBackground
                  ? value === selectedValue
                    ? styles.selectedBackground
                    : styles.contentDisappear
                  : undefined
              )}
              style={{ zIndex: 5 - index }}
            >
              <animated.div
                style={{
                  ...backgroundStyle[index],
                  transformOrigin: '0 20%',
                }}
              >
                <animated.div
                  style={{
                    ...backgroundAppearStyle[index],
                    transformOrigin: '0 0',
                  }}
                >
                  <img
                    src={IMAGES[index]}
                    alt={value}
                    className={styles.backgroundImg}
                    style={{ animationDelay: `${index * 100}ms` }}
                  />
                </animated.div>
              </animated.div>
            </div>
          ))}
        </animated.div>
      </div>
      <div
        style={{
          maxWidth: 340,
          justifySelf: 'end',
          paddingTop: 10,
          position: 'relative',
        }}
      >
        {step === 'preview' ? (
          <animated.div style={contentAppearStyle}>
            <VStack gap={60}>
              <VStack gap={24}>
                <UIText kind="headline/hero">
                  Give your DNA
                  <br />a new look
                </UIText>
                <VStack gap={16}>
                  <UIText kind="body/accent">
                    You are eligible to update your DNA with a new background.
                  </UIText>
                  <UIText kind="body/accent">
                    Each background design represents one of Zerion's values.
                    Choose the one that resonates with you most!
                  </UIText>
                </VStack>
              </VStack>
              <VStack
                gap={12}
                style={{
                  padding: '12px 8px 8px',
                  width: 324,
                  borderRadius: 20,
                  background:
                    'linear-gradient(90deg, #FF7583 0%, #3232DC 98.61%)',
                }}
              >
                <HStack gap={8} alignItems="center" justifyContent="center">
                  <ExplusiveIcon
                    style={{
                      width: 16,
                      height: 16,
                      color: 'var(--always-white)',
                    }}
                  />
                  <UIText kind="caption/accent" color="var(--always-white)">
                    Exclusive DNA attribute
                  </UIText>
                </HStack>
                <Button
                  kind="primary"
                  size={48}
                  onClick={() => setStep('select')}
                >
                  Continue
                </Button>
              </VStack>
            </VStack>
          </animated.div>
        ) : (
          <VStack
            gap={60}
            className={fillBackground ? styles.contentDisappear : undefined}
          >
            <VStack gap={8}>
              <UIText kind="headline/hero">
                Your unique
                <br />
                onchain footprint
              </UIText>
              <UIText kind="body/accent">
                Choose a background for DNA that mirrors your values.
              </UIText>
            </VStack>
            <VStack gap={24}>
              <VStack gap={8}>
                <HStack gap={16}>
                  {VALUE_ORDER.map((value, index) => (
                    <UnstyledButton
                      key={value}
                      className={styles.backgroundButton}
                      onClick={() => {
                        setSelectedValue(value);
                        updateAnimation(value);
                      }}
                    >
                      {value === selectedValue ? (
                        <>
                          <div
                            style={{
                              borderRadius: 8,
                              border: '2px solid var(--always-white)',
                              position: 'absolute',
                              top: 2,
                              left: 2,
                              width: 36,
                              height: 36,
                            }}
                          />
                          <CheckIcon
                            style={{
                              width: 24,
                              height: 24,
                              position: 'absolute',
                              top: 8,
                              left: 8,
                            }}
                          />
                        </>
                      ) : null}
                      <img
                        src={IMAGES[index]}
                        alt={value}
                        style={{ width: 40, height: 40, objectFit: 'cover' }}
                      />
                    </UnstyledButton>
                  ))}
                </HStack>
                <UIText kind="body/accent" style={{ height: 72 }}>
                  {VALUE_TEXTS[selectedValue].title}
                  {'. '}
                  <span style={{ color: 'var(--neutral-700)' }}>
                    {VALUE_TEXTS[selectedValue].description}
                  </span>
                </UIText>
              </VStack>
              <Button kind="primary" size={48} onClick={handleSelect}>
                Choose
              </Button>
            </VStack>
          </VStack>
        )}
      </div>
    </>
  );
}

export function SelectBackground() {
  return (
    <div className={helpersStyles.container} style={{ height: 600 }}>
      <DelayedRender delay={300}>
        <SelectBackgroundContent />
      </DelayedRender>
    </div>
  );
}
