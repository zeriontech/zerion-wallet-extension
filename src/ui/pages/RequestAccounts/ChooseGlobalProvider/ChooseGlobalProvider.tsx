import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import ZerionLogo from 'jsx:src/ui/assets/zerion-logo-squircle-white.svg';
import { useBackgroundKind } from 'src/ui/components/Background/Background';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import {
  TurnOffDuration,
  createInjectionPreference,
} from 'src/ui/components/PauseInjection/actions';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { HStack } from 'src/ui/ui-kit/HStack';
import { invariant } from 'src/shared/invariant';
import { windowPort } from 'src/ui/shared/channels';

const bgKind = { kind: 'white' } as const;
export function ChooseGlobalProvider({
  origin,
  onConfirm,
  onReject,
}: {
  origin: string;
  onConfirm: () => void;
  onReject: () => void;
}) {
  useBackgroundKind(bgKind);
  const { globalPreferences, setGlobalPreferencesAsync } =
    useGlobalPreferences();
  if (!globalPreferences) {
    return <ViewLoading />;
  }
  return (
    <PageColumn>
      <div
        style={{
          display: 'grid',
          gridTemplateRows: '1fr auto',
          height: '100%',
          flexGrow: 1,
        }}
      >
        <div
          style={{
            alignSelf: 'center',
            border: '1px solid var(--neutral-200)',
            borderRadius: 24,
            padding: 40,
          }}
        >
          <VStack gap={24}>
            <UIText kind="headline/h2" style={{ textAlign: 'center' }}>
              <div>Connect to</div>
              <div style={{ color: 'var(--neutral-500)' }}>
                {new URL(origin).hostname}
              </div>
            </UIText>
            <VStack gap={8}>
              <Button kind="primary" onClick={() => onConfirm()}>
                <HStack gap={8} justifyContent="center">
                  <ZerionLogo style={{ width: 20, height: 20 }} />
                  <span>Continue with Zerion</span>
                </HStack>
              </Button>
              <Button
                kind="regular"
                onClick={async () => {
                  await setGlobalPreferencesAsync(
                    createInjectionPreference(globalPreferences, {
                      origin,
                      duration: TurnOffDuration.forever,
                    })
                  );
                  // Give ContentScriptManager time to update
                  await new Promise((r) => setTimeout(r, 100));
                  onReject();
                }}
              >
                Use Other Wallet
              </Button>
            </VStack>
          </VStack>
        </div>
        {/*
        <div style={{ textAlign: 'center' }}>
          <UIText
            kind="small/accent"
            color="var(--neutral-500)"
            as={UnstyledAnchor}
            href="https://zerion.io/blog/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            onClick={openInNewWindow}
          >
            How to connect if there is no ‘Zerion Wallet’ option?
          </UIText>
          <PageBottom />
        </div>
        */}
      </div>
    </PageColumn>
  );
}

export function ChooseGlobalProviderGuard({
  children,
}: React.PropsWithChildren) {
  const [params, setParams] = useSearchParams();
  const origin = params.get('origin');
  const windowId = params.get('windowId');
  const nonEip6963Request = params.get('nonEip6963Request') === 'yes';
  const providerSelected = params.get('providerSelected') === 'yes';

  invariant(origin, 'origin get-parameter is required');
  invariant(windowId, 'windowId get-parameter is required');

  const handleReject = () => windowPort.reject(windowId);

  const showSelectView = nonEip6963Request && !providerSelected;
  if (!showSelectView) {
    return children;
  }

  return (
    <>
      <ChooseGlobalProvider
        origin={origin}
        onConfirm={() => {
          setParams(
            (params) => {
              const newParams = new URLSearchParams(params);
              newParams.set('providerSelected', 'yes');
              return newParams;
            },
            { replace: true }
          );
        }}
        onReject={() => {
          // Do not reload the dapp because we will forward request
          // automatically to the other wallet. But I want to leave the comment here
          // in case we need to revert
          //
          // reloadTabsByOrigin({ origin });

          handleReject();
        }}
      />
    </>
  );
}
