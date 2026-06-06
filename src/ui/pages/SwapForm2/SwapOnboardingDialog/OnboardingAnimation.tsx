import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from 'src/ui/components/TransactionSigner/Toaster/useReducedMotion';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import rotateSrc from 'url:./assets/rotate.png';
import token01 from 'url:./assets/token-01.png';
import token02 from 'url:./assets/token-02.png';
import token04 from 'url:./assets/token-04.png';
import token05 from 'url:./assets/token-05.png';
import token06 from 'url:./assets/token-06.png';
import token07 from 'url:./assets/token-07.png';
import token08 from 'url:./assets/token-08.png';
import token09 from 'url:./assets/token-09.png';
import token10 from 'url:./assets/token-10.png';
import token12 from 'url:./assets/token-12.png';
import token15 from 'url:./assets/token-15.png';
import token18 from 'url:./assets/token-18.png';
import network0 from 'url:./assets/network-0.png';
import network1 from 'url:./assets/network-1.png';
import network2 from 'url:./assets/network-2.png';
import network3 from 'url:./assets/network-3.png';
import network4 from 'url:./assets/network-4.png';
import network5 from 'url:./assets/network-5.png';
import network6 from 'url:./assets/network-6.png';
import network7 from 'url:./assets/network-7.png';

// Frame dimensions match the Figma banner exactly. The banner is rendered at
// a fixed 414x280 internal layout, then horizontally centered inside whatever
// width the dialog ends up at. Satellite columns at left=-49 and left=383
// deliberately bleed past the 414 viewport — overflow:hidden on the banner
// clips them, producing the "icons reaching beyond the frame" effect.
const FRAME_WIDTH = 414;
const FRAME_HEIGHT = 280;

const SATELLITE_SIZE = 80;
const CENTER_SIZE_START = 64;
const CENTER_SIZE_END = 80;

// Center-pair positions, expressed as the icon's CENTER point in frame coords.
// Step 1 (size 64): left=99/251, so centers at x=131 and x=283.
// Step 2 (size 80): left=59/275, so centers at x=99 and x=315.
const CENTER_LEFT_START_X = 131;
const CENTER_RIGHT_START_X = 283;
const CENTER_LEFT_END_X = 99;
const CENTER_RIGHT_END_X = 315;
const CENTER_Y = 124; // top=84 + size/2 in step 2 (matches Figma top:84 size:80)

type Vec = { x: number; y: number };
const cellCenter = (left: number, top: number): Vec => ({
  x: left + SATELLITE_SIZE / 2,
  y: top + SATELLITE_SIZE / 2,
});

// Each entry is a token+network composite, placed via x/y of its CENTER point.
// Mirrors frame_2's layout: 5 cols (left -49, 59, 167, 275, 383) x 3 rows
// (top -24, 84, 192), minus the middle-row-center cell which the sync icon
// occupies (the center pair itself flanks that cell at cols 59 and 275).
type IconSpec = { token: string; network: string; final: Vec };

const SATELLITES: IconSpec[] = [
  // Top row
  { token: token15, network: network6, final: cellCenter(-49, -24) },
  { token: token09, network: network1, final: cellCenter(59, -24) },
  { token: token15, network: network4, final: cellCenter(167, -24) },
  { token: token07, network: network2, final: cellCenter(275, -24) },
  { token: token06, network: network3, final: cellCenter(383, -24) },
  // Middle row sides — flanking the center pair
  { token: token01, network: network0, final: cellCenter(-49, 84) },
  { token: token02, network: network7, final: cellCenter(383, 84) },
  // Bottom row
  { token: token12, network: network5, final: cellCenter(-49, 192) },
  { token: token05, network: network2, final: cellCenter(59, 192) },
  { token: token08, network: network4, final: cellCenter(167, 192) },
  { token: token10, network: network3, final: cellCenter(275, 192) },
  { token: token12, network: network5, final: cellCenter(383, 192) },
];

const FRAME_CENTER: Vec = { x: FRAME_WIDTH / 2, y: FRAME_HEIGHT / 2 };

// Distance the satellites travel inward to settle, expressed as a multiplier
// on the (final - frameCenter) vector. 2.2 means they start 2.2× as far from
// center as they end up — well outside the frame.
const ENTRY_DISTANCE_MULTIPLIER = 2.2;

function radialEntryOffset(final: Vec): Vec {
  const dx = final.x - FRAME_CENTER.x;
  const dy = final.y - FRAME_CENTER.y;
  return {
    x: dx * (ENTRY_DISTANCE_MULTIPLIER - 1),
    y: dy * (ENTRY_DISTANCE_MULTIPLIER - 1),
  };
}

const SOFT_SPRING = {
  type: 'spring' as const,
  stiffness: 150,
  damping: 20,
  mass: 1,
};

// Bouncier spring for the two center tokens + rotate icon — they only scale
// (and the centers also separate horizontally), so a livelier spring reads as
// a tactile "ta-da" without the wobble being amplified by long travel.
const BOUNCY_SPRING = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 12,
  mass: 1,
};

const ANIMATION_DELAY_MS = 1000;

// Center pair starts at 64px and grows to 80px. Use a scale transform so the
// inner CSS-composed TokenIcon (which sizes the network badge in pixels)
// scales as a whole rather than redoing the layout math at every frame.
const CENTER_INITIAL_SCALE = CENTER_SIZE_START / CENTER_SIZE_END;

// Rotate icon scales in alongside the center pair — same start scale so the
// sync glyph reads as tied to the token-pair visual.
const ROTATE_INITIAL_SCALE = 0.8;

// Figma layers the network badge at inset 56.25% / 43.75% over a 64-or-80px
// token base. Express as a ratio of the icon container so it scales correctly
// for both 64px (centers, step 1) and 80px (satellites + step 2) sizes.
const NETWORK_INSET_RATIO = 0.5625;
const NETWORK_SIZE_RATIO = 1 - NETWORK_INSET_RATIO;

function TokenIcon({
  size,
  token,
  network,
  style,
}: {
  size: number;
  token: string;
  network: string;
  style?: React.CSSProperties;
}) {
  const networkSize = size * NETWORK_SIZE_RATIO;
  const networkOffset = size * NETWORK_INSET_RATIO;
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        ...style,
      }}
    >
      <img
        src={token}
        alt=""
        width={size}
        height={size}
        style={{
          position: 'absolute',
          inset: 0,
          width: size,
          height: size,
          display: 'block',
        }}
      />
      <img
        src={network}
        alt=""
        width={networkSize}
        height={networkSize}
        style={{
          position: 'absolute',
          left: networkOffset,
          top: networkOffset,
          width: networkSize,
          height: networkSize,
          borderRadius: 8,
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  );
}

const COMPACT_HEIGHT_THRESHOLD = 700;
const COMPACT_CROP = 72;

export function OnboardingAnimation() {
  const reducedMotion = useReducedMotion();
  const { innerHeight } = useWindowSizeStore();
  const isCompact = innerHeight < COMPACT_HEIGHT_THRESHOLD;
  const cropAmount = isCompact ? COMPACT_CROP : 0;
  const [animationStarted, setAnimationStarted] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      setAnimationStarted(true);
      return;
    }
    const id = window.setTimeout(
      () => setAnimationStarted(true),
      ANIMATION_DELAY_MS
    );
    return () => window.clearTimeout(id);
  }, [reducedMotion]);

  const initialCenterScale = reducedMotion ? 1 : CENTER_INITIAL_SCALE;
  const initialLeftX = reducedMotion ? CENTER_LEFT_END_X : CENTER_LEFT_START_X;
  const initialRightX = reducedMotion
    ? CENTER_RIGHT_END_X
    : CENTER_RIGHT_START_X;
  const initialRotateScale = reducedMotion ? 1 : ROTATE_INITIAL_SCALE;

  const transition = reducedMotion ? { duration: 0.2 } : SOFT_SPRING;
  const centerTransition = reducedMotion ? { duration: 0.2 } : BOUNCY_SPRING;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: FRAME_HEIGHT - cropAmount,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: -cropAmount / 2,
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          transform: 'translateX(-50%)',
        }}
      >
        {/* Satellites — fly in radially from outside the frame */}
        {SATELLITES.map((sat, i) => {
          const offset = radialEntryOffset(sat.final);
          const initial = reducedMotion
            ? { x: sat.final.x, y: sat.final.y, opacity: 1 }
            : {
                x: sat.final.x + offset.x,
                y: sat.final.y + offset.y,
                opacity: 0,
              };
          const animate = animationStarted
            ? { x: sat.final.x, y: sat.final.y, opacity: 1 }
            : initial;
          return (
            <motion.div
              key={i}
              initial={initial}
              animate={animate}
              transition={transition}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: SATELLITE_SIZE,
                height: SATELLITE_SIZE,
                // x/y in motion drive the translate; offset the icon's own
                // half-size so x/y addresses the icon CENTER.
                marginLeft: -SATELLITE_SIZE / 2,
                marginTop: -SATELLITE_SIZE / 2,
                pointerEvents: 'none',
              }}
            >
              <TokenIcon
                size={SATELLITE_SIZE}
                token={sat.token}
                network={sat.network}
              />
            </motion.div>
          );
        })}

        {/* Center pair — grows from 64 to 80 (via scale) and separates outward.
            Icon18 (Solana-network token) on the left, Icon04 on the right.
            Fixed 80px TokenIcon scaled down at start; bouncy spring on the
            scale-up. */}
        <motion.div
          initial={{
            x: initialLeftX,
            y: CENTER_Y,
            scale: initialCenterScale,
          }}
          animate={
            animationStarted
              ? { x: CENTER_LEFT_END_X, y: CENTER_Y, scale: 1 }
              : undefined
          }
          transition={centerTransition}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: CENTER_SIZE_END,
            height: CENTER_SIZE_END,
            marginLeft: -CENTER_SIZE_END / 2,
            marginTop: -CENTER_SIZE_END / 2,
            pointerEvents: 'none',
          }}
        >
          <TokenIcon
            size={CENTER_SIZE_END}
            token={token18}
            network={network3}
          />
        </motion.div>
        <motion.div
          initial={{
            x: initialRightX,
            y: CENTER_Y,
            scale: initialCenterScale,
          }}
          animate={
            animationStarted
              ? { x: CENTER_RIGHT_END_X, y: CENTER_Y, scale: 1 }
              : undefined
          }
          transition={centerTransition}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: CENTER_SIZE_END,
            height: CENTER_SIZE_END,
            marginLeft: -CENTER_SIZE_END / 2,
            marginTop: -CENTER_SIZE_END / 2,
            pointerEvents: 'none',
          }}
        >
          <TokenIcon
            size={CENTER_SIZE_END}
            token={token04}
            network={network2}
          />
        </motion.div>

        {/* Sync rotate icon — scales in with the center pair. Figma applies a
            -90deg rotation to the source glyph so the loop reads as a vertical
            swap pair rather than the horizontal source. */}
        <motion.img
          src={rotateSrc}
          alt=""
          width={40}
          height={40}
          initial={{ scale: initialRotateScale, rotate: -90 }}
          animate={animationStarted ? { scale: 1, rotate: -90 } : undefined}
          transition={centerTransition}
          style={{
            position: 'absolute',
            left: FRAME_CENTER.x - 20,
            top: CENTER_Y - 20,
            width: 40,
            height: 40,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}
