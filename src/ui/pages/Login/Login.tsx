import React, {
  useCallback,
  useEffect,
  useId,
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
import { PageFullBleedColumn } from 'src/ui/components/PageFullBleedColumn';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import { walletPort } from 'src/ui/shared/channels';
import { invariant } from 'src/shared/invariant';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { TouchIdLogin } from '../Security/TouchIdLogin';
import { LayersAnimationLottie } from './LayersAnimationLottie';
import { type LottieComponentHandle } from './LayersAnimationLottie';

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
          <LayersAnimationLottie
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
                  'linear(0, 0.0023, 0.009 0.96%, 0.0344, 0.0735 2.87%, 0.138 4.07%, 0.2844 6.22%, 0.7215 11.97%, 0.8467 13.89%, 0.94, 1.0164 17.24%, 1.0826 19.15%, 1.1231 20.83%, 1.1393, 1.1511 22.74%, 1.1599, 1.163, 1.1612 26.33%, 1.1538 27.77%, 1.1293 30.4%, 1.0497 36.87%, 1.015 40.22%, 0.9998 42.14%, 0.9896 43.81%, 0.9812, 0.976 47.64%, 0.9734 50.28%, 0.9751 53.15%, 0.9966 64.88%, 1.0035 71.82%, 1.0042 77.81%, 0.9993 99.83%)',
                ['--spring-duration' as string]: '0.8s',
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
    <PageColumn
      style={{ width: 'clamp(320px, 100vw, 450px)', marginInline: 'auto' }}
    >
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
          {user ? (
            <TouchIdLogin
              user={user}
              onSuccess={() => {
                navigate(params.get('next') || '/', {
                  // If user clicks "back" when we redirect them,
                  // we should take them to overview, not back to the login view
                  replace: true,
                });
              }}
              style={{ justifyItems: 'center' }}
            />
          ) : null}
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
