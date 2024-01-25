import React from 'react';
import { PageColumn } from 'src/ui/components/PageColumn';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { useBackgroundKind } from 'src/ui/components/Background/Background';
import { PageBottom } from 'src/ui/components/PageBottom';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import {
  TurnOffDuration,
  createPreference,
} from 'src/ui/components/PauseInjection/actions';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { reloadTabsByOrigin } from 'src/ui/shared/reloadActiveTab';

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
            padding: 24,
          }}
        >
          <VStack gap={24}>
            <UIText kind="headline/h2">
              <div>Choose a wallet to connect to</div>
              <div style={{ textAlign: 'center', color: 'var(--neutral-500)' }}>
                {new URL(origin).hostname}
              </div>
            </UIText>
            <VStack gap={8}>
              <Button kind="primary" onClick={() => onConfirm()}>
                Continue with Zerion
              </Button>
              <Button
                kind="regular"
                onClick={async () => {
                  await setGlobalPreferencesAsync(
                    createPreference(globalPreferences, {
                      origin,
                      duration: TurnOffDuration.forever,
                    })
                  );
                  onReject();
                }}
              >
                Use Other (will reload dapp)
              </Button>
            </VStack>
            <UIText
              kind="body/accent"
              color="var(--neutral-500)"
              style={{ textAlign: 'center' }}
            >
              You can always change this later inside Zerion Wallet
            </UIText>
          </VStack>
        </div>
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
      </div>
    </PageColumn>
  );
}
