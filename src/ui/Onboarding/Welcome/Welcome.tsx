import React from 'react';
import cn from 'classnames';
import { animated } from '@react-spring/web';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { UIText } from 'src/ui/ui-kit/UIText';
import CreateIcon from 'jsx:../assets/option_secondary_create.svg';
import ImportIcon from 'jsx:../assets/option_secondary_import.svg';
import HardWareIcon from 'jsx:../assets/option_secondary_hardware.svg';
import { useTransformTrigger } from 'src/ui/components/useTransformTrigger';
import { useSizeStore } from '../useSizeStore';
import { Stack } from '../Stack';
import CreateImg from '../assets/option_create.png';
import ImportImg from '../assets/option_import.png';
import HardwareImg from '../assets/option_hardware.png';
import * as helpersStyles from '../shared/helperStyles.module.css';
import { useOnboardingSession } from '../shared/useOnboardingSession';
import * as styles from './styles.module.css';

interface ImportOptionConfig {
  primaryImage: React.ReactNode;
  secondaryIcon: React.ReactNode;
  secondaryIconClassName: string;
  to: string;
  title: string;
  className: string;
}

function ImportOption({
  primaryImage,
  secondaryIcon,
  secondaryIconClassName,
  to,
  title,
  className,
}: ImportOptionConfig) {
  const { isNarrowView } = useSizeStore();
  const { style, trigger: hoverTrigger } = useTransformTrigger({
    scale: 1.05,
    rotation: 8,
    springConfig: {
      tension: 300,
      friction: 10,
    },
  });

  return (
    <UnstyledLink to={to} className={styles.link} onMouseEnter={hoverTrigger}>
      <VStack gap={isNarrowView ? 8 : 16} className={className}>
        <UIText kind="headline/h3" className={styles.title}>
          {title}
        </UIText>
        <div
          style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            height: isNarrowView ? 110 : 148,
            paddingTop: 35,
            top: isNarrowView ? -35 : 0,
          }}
        >
          {primaryImage}
          <div
            style={{ position: 'absolute' }}
            className={secondaryIconClassName}
          >
            <animated.div
              style={{
                ...style,
                transformOrigin: '50% 50%',
              }}
            >
              {secondaryIcon}
            </animated.div>
          </div>
        </div>
      </VStack>
    </UnstyledLink>
  );
}

const IMPORT_OPTIONS: ImportOptionConfig[] = [
  {
    title: 'Create New Wallet',
    to: '/onboarding/create',
    className: cn(styles.option, styles.create),
    primaryImage: (
      <img
        src={CreateImg}
        alt="Create New Wallet"
        className={styles.createImg}
      />
    ),
    secondaryIcon: (
      <CreateIcon
        className={styles.secondaryIcon}
        style={{ width: 44, height: 44 }}
      />
    ),
    secondaryIconClassName: styles.createIcon,
  },
  {
    title: 'Import Existing Wallet',
    to: '/onboarding/import',
    className: cn(styles.option, styles.import),
    primaryImage: (
      <img
        src={ImportImg}
        alt="Import Existing Wallet"
        className={styles.importImg}
      />
    ),
    secondaryIcon: (
      <ImportIcon
        className={styles.secondaryIcon}
        style={{ width: 49, height: 54 }}
      />
    ),
    secondaryIconClassName: styles.importIcon,
  },
  {
    title: 'Connect Ledger',
    to: '/onboarding/hardware',
    className: cn(styles.option, styles.hardware),
    primaryImage: (
      <img
        src={HardwareImg}
        alt="Connect Ledger"
        className={styles.hardwareImg}
      />
    ),
    secondaryIcon: (
      <HardWareIcon
        className={styles.secondaryIcon}
        style={{ width: 34, height: 63 }}
      />
    ),
    secondaryIconClassName: styles.hardwareIcon,
  },
];

function ImportOptions() {
  const { isNarrowView } = useSizeStore();
  return (
    <Stack
      gap={16}
      direction={isNarrowView ? 'vertical' : 'horizontal'}
      className={helpersStyles.appear}
      style={{
        gridTemplateColumns: isNarrowView ? undefined : '1fr 1fr 1fr',
        animationDelay: '300ms',
        animationDuration: '500ms',
      }}
    >
      {IMPORT_OPTIONS.map((option) => (
        <ImportOption key={option.title} {...option} />
      ))}
    </Stack>
  );
}

function Banner() {
  const { isNarrowView } = useSizeStore();
  return (
    <VStack
      gap={12}
      className={helpersStyles.appear}
      style={{
        animationDuration: '500ms',
        justifyItems: 'center',
        borderRadius: 20,
        boxShadow: '0px 12px 44px 0px rgba(0, 0, 0, 0.08)',
        padding: isNarrowView ? '40px 16px' : '54px 32px',
        textAlign: 'center',
        maxHeight: 224,
        backgroundSize: '100% 100%',
        backgroundImage: `url(${require('../assets/welcome_background.png')})`,
      }}
    >
      <div
        style={{
          fontSize: isNarrowView ? 40 : 60,
          fontWeight: 500,
          lineHeight: isNarrowView ? '48px' : '80px',
          letterSpacing: '-0.3px',
          color: 'var(--always-white)',
        }}
      >
        Welcome to Zerion
      </div>
      <UIText
        kind={isNarrowView ? 'body/accent' : 'headline/h3'}
        color="var(--always-white)"
      >
        A wallet for self-custodial humans. All your crypto & NFTs. 10+ chains.
      </UIText>
    </VStack>
  );
}

export function Welcome() {
  const { isNarrowView } = useSizeStore();
  useOnboardingSession('overview');

  return (
    <VStack gap={isNarrowView ? 24 : 40}>
      <Banner />
      <ImportOptions />
    </VStack>
  );
}
