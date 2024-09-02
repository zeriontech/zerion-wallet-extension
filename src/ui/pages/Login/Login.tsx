import React, {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import type { PublicUser } from 'src/shared/types/User';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as s from 'src/ui/style/helpers.module.css';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { Input } from 'src/ui/ui-kit/Input';
import ZerionLogo from 'jsx:src/ui/assets/zerion-squircle.svg';
import { useBodyStyle } from 'src/ui/components/Background/Background';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
import type { AnimationItem } from 'lottie-web';
import { PageFullBleedColumn } from 'src/ui/components/PageFullBleedColumn';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import { walletPort } from 'src/ui/shared/channels';
import { invariant } from 'src/shared/invariant';
import { DelayedRender } from 'src/ui/components/DelayedRender';

async function loadLottieWeb() {
  const lottieModule = await import('lottie-web');
  return lottieModule as unknown as (typeof lottieModule)['default'];
}

class LottieModule {
  animationItem: AnimationItem | null = null;
  options: { onAnimationReady?: () => void };
  private disposables: Array<() => void> = [];

  async prepareResources() {
    const [lottieWeb, animationData] = await Promise.all([
      await loadLottieWeb(),
      await import('./login-animation-lottie.json'),
    ]);
    return { lottieWeb, animationData };
  }

  constructor({ onAnimationReady }: { onAnimationReady?: () => void }) {
    this.options = { onAnimationReady };
  }

  async startAnimation(
    container: Element,
    { autoplay, signal }: { autoplay: boolean; signal: AbortSignal }
  ) {
    const { lottieWeb, animationData } = await this.prepareResources();
    if (signal.aborted) {
      return;
    }
    const item = lottieWeb.loadAnimation({
      container,
      animationData,
      loop: false,
      autoplay,
      renderer: 'svg',
    });
    function loopOnCompleted() {
      const FRAME_NUMBER_TO_START_LOOP = 39;
      item.goToAndPlay(FRAME_NUMBER_TO_START_LOOP, true);
    }
    item.addEventListener('complete', loopOnCompleted);
    this.disposables.push(() =>
      item.removeEventListener('complete', loopOnCompleted)
    );
    this.options.onAnimationReady?.();
    this.animationItem = item;
  }

  destroy() {
    this.disposables.forEach((dispose) => dispose());
    this.animationItem?.destroy();
    this.animationItem = null;
  }
}

interface LottieComponentHandle {
  startAnimation: () => void;
}

const LayersLottieAnimation = React.forwardRef(function LayersLottieAnimation(
  {
    onAnimationReady,
  }: {
    onAnimationReady?: () => void;
  },
  ref: React.Ref<LottieComponentHandle>
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lottieModuleRef = useRef<LottieModule | null>(null);

  const onAnimationStartRef = useRef(onAnimationReady);
  useLayoutEffect(() => {
    onAnimationStartRef.current = onAnimationReady;
  });

  useImperativeHandle(ref, () => ({
    startAnimation() {
      lottieModuleRef.current?.animationItem?.play();
    },
  }));

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const lottieModule = new LottieModule({
      onAnimationReady: () => onAnimationStartRef.current?.(),
    });
    lottieModuleRef.current = lottieModule;
    const abortController = new AbortController();
    const { signal } = abortController;
    lottieModule.startAnimation(containerRef.current, {
      autoplay: false,
      signal,
    });
    return () => {
      lottieModuleRef.current = null;
      abortController.abort();
      lottieModule.destroy();
    };
  }, []);

  return <div ref={containerRef} />;
});

function LoginPageAnimation({ address }: { address: string | null }) {
  const [lottieIsReady, setLottieIsReady] = useState(false);
  const [avatarImageIsReady, setAvatarImageIsReady] = useState(false);
  const [lottieStarted, setLottieStarted] = useState(false);
  const handleAvatarImageReady = useCallback(
    () => setAvatarImageIsReady(true),
    []
  );
  const lottieComponentRef = useRef<LottieComponentHandle | null>(null);
  const hasAddressValue = Boolean(address);
  useEffect(() => {
    if (lottieIsReady && (!hasAddressValue || avatarImageIsReady)) {
      lottieComponentRef.current?.startAnimation();
      setLottieStarted(true);
    }
  }, [lottieIsReady, avatarImageIsReady, hasAddressValue]);
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute' }}>
        <DelayedRender>
          {/* Expensive component, delay rendering so that initial view render is fast */}
          <LayersLottieAnimation
            ref={lottieComponentRef}
            onAnimationReady={() => setLottieIsReady(true)}
          />
        </DelayedRender>
      </div>
      <Spacer height={130} />
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ZStack style={{ placeItems: 'center' }}>
          <ZerionLogo style={{ width: 54, height: 54 }} />
          {address ? (
            <div
              style={{
                opacity: lottieStarted ? 1 : 0,
                transform: lottieStarted ? 'scale(1)' : 'scale(0.8)',
                // Looks line "linear" easing is supported in target browsers:
                // https://caniuse.com/mdn-css_types_easing-function_linear-function
                // Configure spring transition:
                // https://www.kvin.me/css-springs
                ['--spring-easing' as string]:
                  'linear(0, 0.0018, 0.007 1.16%, 0.0332, 0.0753, 0.1297 5.52%, 0.2489 8.13%, 0.6447 15.97%, 0.7592, 0.8569 21.19%, 0.9284 23.52%, 0.9917 26.13%, 1.0335 28.45%, 1.066 31.06%, 1.082, 1.0911 35.13%, 1.0948, 1.0927 39.77%, 1.0874, 1.0798 43.84%, 1.0346 53.42%, 1.0162 58.06%, 1.0018, 0.9939 68.52%, 0.9914 72.58%, 0.9912 77.51%, 0.9996 99.87%)',
                ['--spring-duration' as string]: '0.8300s',
                transition:
                  'opacity 400ms, transform var(--spring-duration) var(--spring-easing)',
              }}
            >
              <WalletAvatar
                address={address}
                size={64}
                borderRadius={12}
                onReady={handleAvatarImageReady}
              />
            </div>
          ) : null}
        </ZStack>
      </div>
    </div>
  );
}

export function Login() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const {
    data: user,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['account/getExistingUser'],
    queryFn: () => {
      return accountPublicRPCPort.request('getExistingUser');
    },
  });
  const formId = useId();
  const inputId = useId();

  const userId = user?.id;

  const { data: lastUsedAddress } = useQuery({
    enabled: Boolean(userId),
    queryKey: ['wallet/getLastUsedAddress', userId],
    queryFn: async () => {
      invariant(userId, "user['id'] is required");
      return walletPort.request('getLastUsedAddress', { userId });
    },
  });
  const loginMutation = useMutation({
    mutationFn: async ({
      user,
      password,
    }: {
      user: PublicUser;
      password: string;
    }) => {
      return accountPublicRPCPort.request('login', { user, password });
    },
    onSuccess: async () => {
      zeroizeAfterSubmission();
      // There's a rare weird bug when logging in reloads login page instead of redirecting to overview.
      // Maybe this will fix it? If not, then remove this delay
      await new Promise((r) => setTimeout(r, 100));
      navigate(params.get('next') || '/', {
        // If user clicks "back" when we redirect them,
        // we should take them to overview, not back to the login view
        replace: true,
      });
    },
  });

  useBodyStyle(useMemo(() => ({ backgroundColor: 'var(--white)' }), []));
  if (isLoading) {
    return null;
  }
  if (isError) {
    throw error;
  }
  if (!user) {
    return <Navigate to="/" replace={true} />;
  }
  return (
    <PageColumn>
      <PageFullBleedColumn
        paddingInline={false}
        style={{ position: 'relative' }}
      >
        <LoginPageAnimation address={lastUsedAddress || null} />
      </PageFullBleedColumn>
      <Spacer height={74} />
      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();
          const password = new FormData(event.currentTarget).get('password') as
            | string
            | undefined;
          if (!password) {
            return;
          }
          if (!user) {
            throw new Error('Cannot login: user not found');
          }
          loginMutation.mutate({ user, password });
        }}
      >
        <VStack gap={24}>
          <UIText
            as="label"
            htmlFor={inputId}
            kind="headline/h1"
            style={{ textAlign: 'center' }}
          >
            Welcome Back!
          </UIText>
          <VStack gap={4}>
            <Input
              id={inputId}
              autoFocus={true}
              type="password"
              name="password"
              placeholder="Password"
              required={true}
            />
            {loginMutation.error ? (
              <UIText kind="caption/regular" color="var(--negative-500)">
                {(loginMutation.error as Error).message || 'unknown error'}
              </UIText>
            ) : null}
          </VStack>
          <Button form={formId} disabled={loginMutation.isLoading}>
            {loginMutation.isLoading ? 'Checking...' : 'Unlock'}
          </Button>
        </VStack>
      </form>
      <Spacer height={24} />
      <UIText
        as={UnstyledLink}
        to="/forgot-password"
        kind="body/accent"
        color="var(--neutral-500)"
        style={{ textAlign: 'center', marginTop: 'auto' }}
      >
        <span className={s.hoverUnderline}>Need Help?</span>
      </UIText>
      <PageBottom />
    </PageColumn>
  );
}
