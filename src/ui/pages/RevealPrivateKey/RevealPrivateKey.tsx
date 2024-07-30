import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { invariant } from 'src/shared/invariant';
import { useBackgroundKind } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { VerifyUser } from 'src/ui/components/VerifyUser';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { PageBottom } from 'src/ui/components/PageBottom';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import { assertSignerContainer } from 'src/shared/types/validators';
import { isSessionExpiredError } from 'src/ui/shared/isSessionExpiredError';
import { whiteBackgroundKind } from 'src/ui/components/Background/Background';
import { BlurredToggle } from 'src/ui/components/BlurredToggle';
import { useWalletGroup } from 'src/ui/shared/requests/useWalletGroups';
import { updateSearchParam } from 'src/ui/shared/updateSearchParam';
import { usePrivateKey } from './usePrivateKey';

function Reveal({
  address,
  onSubmit,
  onSessionExpired,
}: {
  groupId: string;
  address: string;
  onSubmit: () => void;
  onSessionExpired: () => void;
}) {
  const {
    data: privateKey,
    isLoading,
    isError,
    error,
  } = usePrivateKey(address);

  const { handleCopy, isSuccess: isCopySuccess } = useCopyToClipboard({
    text: privateKey || '',
  });

  useEffect(() => {
    if (isError && isSessionExpiredError(error)) {
      onSessionExpired();
    }
  }, [isError, error, onSessionExpired]);

  if (isLoading) {
    return <ViewLoading />;
  }

  if (!privateKey) {
    if (isError && isSessionExpiredError(error)) {
      return null;
    }
    throw new Error('Could not get private key');
  }

  return (
    <PageColumn>
      <PageTop />
      <UIText kind="body/regular">
        <span>
          Your private key can be used to access all of your funds. Do not share
          it with anyone
        </span>
      </UIText>
      <Spacer height={24} />
      <VStack gap={16}>
        <BlurredToggle>
          <Surface
            padding={16}
            style={{
              paddingRight: 36, // because of toggle button on the right
            }}
          >
            <UIText kind={'body/regular'} style={{ wordBreak: 'break-word' }}>
              {privateKey}
            </UIText>
          </Surface>
        </BlurredToggle>
        <div style={{ textAlign: 'center' }}>
          <Button
            kind="regular"
            size={36}
            type="button"
            onClick={handleCopy}
            style={{ paddingLeft: 16, paddingRight: 16 }}
          >
            <HStack gap={8}>
              {React.createElement(isCopySuccess ? CheckIcon : CopyIcon, {
                style: { display: 'block', width: 20, height: 20 },
              })}
              <ZStack
                hideLowerElements={true}
                justifyContent="start"
                style={{ textAlign: 'left' }}
              >
                {isCopySuccess ? <span>Copied to Clipboard</span> : null}
                <span aria-hidden={isCopySuccess}>Copy to Clipboard</span>
              </ZStack>
            </HStack>
          </Button>
        </div>
      </VStack>
      <Button
        style={{ marginTop: 'auto' }}
        autoFocus={true}
        onClick={() => onSubmit()}
      >
        Done
      </Button>
      <PageBottom />
    </PageColumn>
  );
}

export function RevealPrivateKey() {
  useBackgroundKind(whiteBackgroundKind);

  const [params, setSearchParams] = useSearchParams();

  const groupId = params.get('groupId');
  const address = params.get('address');
  invariant(groupId, 'groupId param is required for RevealPrivateKey view');
  invariant(address, 'address param is required for RevealPrivateKey view');

  const navigate = useNavigate();

  const { data: walletGroup, isLoading } = useWalletGroup({ groupId });
  if (isLoading || !walletGroup) {
    return null;
  }
  assertSignerContainer(walletGroup.walletContainer);

  return (
    <>
      {params.has('step') == false ? (
        <PageColumn>
          <NavigationTitle title="Private Key Export" />
          <PageTop />
          <VerifyUser
            text={'Verification is required to show your private key'}
            onSuccess={() =>
              setSearchParams(updateSearchParam('step', 'revealSecret'), {
                replace: true,
              })
            }
          />
          <PageBottom />
        </PageColumn>
      ) : null}
      {params.get('step') === 'revealSecret' ? (
        <Reveal
          groupId={groupId}
          address={address}
          onSessionExpired={() => {
            setSearchParams(updateSearchParam('step', 'verifyUser'), {
              replace: true,
            });
          }}
          onSubmit={() => {
            navigate('/');
          }}
        />
      ) : null}
    </>
  );
}
