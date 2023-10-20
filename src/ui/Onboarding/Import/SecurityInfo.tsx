import React from 'react';
import { animated } from '@react-spring/web';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import ShieldIcon from 'jsx:src/ui/assets/shield-filled.svg';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import EyeIcon from 'jsx:src/ui/assets/eye.svg';
import PersonIcon from 'jsx:src/ui/assets/person.svg';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { useTransformTrigger } from 'src/ui/components/useTransformTrigger';
import { useSizeStore } from '../useSizeStore';
import { Stack } from '../Stack';
import * as styles from './styles.module.css';

export function SecurityInfo() {
  const { innerWidth } = useSizeStore();
  const { style: iconStyle, trigger: hoverTrigger } = useTransformTrigger({
    x: 2,
  });

  return (
    <Stack
      direction={innerWidth < 830 ? 'vertical' : 'horizontal'}
      gap={innerWidth < 830 ? 16 : 32}
      style={{
        justifyContent: 'space-between',
        padding: '16px 88px',
        background: 'linear-gradient(91deg, #3232DC 0%, #FF7583 100%)',
        whiteSpace: 'nowrap',
      }}
    >
      <Stack
        direction={innerWidth < 720 ? 'vertical' : 'horizontal'}
        gap={innerWidth < 720 ? 12 : 32}
        style={{ color: 'var(--always-white)' }}
      >
        <HStack
          gap={8}
          alignItems="center"
          style={{ paddingBlock: innerWidth < 720 ? 0 : 12 }}
        >
          <ShieldIcon style={{ width: 20, height: 20 }} />
          <UIText kind="small/accent">Independently audited</UIText>
        </HStack>
        <HStack
          gap={8}
          alignItems="center"
          style={{ paddingBlock: innerWidth < 720 ? 0 : 12 }}
        >
          <EyeIcon style={{ width: 20, height: 20 }} />
          <UIText kind="small/accent">Open-sourced</UIText>
        </HStack>
        <HStack
          gap={8}
          alignItems="center"
          style={{ paddingBlock: innerWidth < 720 ? 0 : 12 }}
        >
          <PersonIcon style={{ width: 20, height: 20 }} />
          <UIText kind="small/accent">Self custodial</UIText>
        </HStack>
      </Stack>
      <UnstyledAnchor
        href="https://zerion.io/security"
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={hoverTrigger}
        className={styles.securityLink}
        style={{ paddingBlock: innerWidth < 830 ? 0 : 12 }}
      >
        <HStack gap={4} alignItems="center">
          <UIText kind="small/regular">Learn more</UIText>
          <animated.div style={{ ...iconStyle, display: 'flex' }}>
            <ChevronRightIcon style={{ width: 16, height: 16 }} />
          </animated.div>
        </HStack>
      </UnstyledAnchor>
    </Stack>
  );
}
