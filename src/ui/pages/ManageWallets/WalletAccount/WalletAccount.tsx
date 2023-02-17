import React, { useCallback, useId, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'react-query';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { NotFoundPage } from 'src/ui/components/NotFoundPage';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { walletPort } from 'src/ui/shared/channels';
import { HStack } from 'src/ui/ui-kit/HStack';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import { PageBottom } from 'src/ui/components/PageBottom';
import { Surface } from 'src/ui/ui-kit/Surface';
import { useProfileName } from 'src/ui/shared/useProfileName';
import { Media } from 'src/ui/ui-kit/Media';
import { PortfolioValue } from 'src/ui/shared/requests/PortfolioValue';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { NBSP } from 'src/ui/shared/typography';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { BareWallet } from 'src/shared/types/BareWallet';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { Button } from 'src/ui/ui-kit/Button';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { invariant } from 'src/shared/invariant';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { InputDecorator } from 'src/ui/ui-kit/Input/InputDecorator';

function EditableWalletName({
  id,
  wallet,
  onRename,
}: {
  id: string;
  wallet: BareWallet;
  onRename?: () => void;
}) {
  const [value, setValue] = useState(wallet.name || '');
  const { mutate, ...renameMutation } = useMutation(
    (value: string) =>
      walletPort.request('renameAddress', {
        address: wallet.address,
        name: value,
      }),
    {
      onSuccess() {
        onRename?.();
      },
    }
  );
  const debouncedRenameRequest = useDebouncedCallback(
    useCallback((value: string) => mutate(value), [mutate]),
    500
  );

  const displayName = useProfileName(wallet);

  return (
    <VStack gap={4}>
      <div
        style={{
          display: 'grid',
          gap: 4,
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
        }}
      >
        <UnstyledInput
          id={id}
          placeholder={displayName || 'Account Name'}
          type="text"
          value={value}
          onChange={(event) => {
            const name = event.target.value;
            debouncedRenameRequest(name);
            setValue(name);
          }}
        />
        {renameMutation.isLoading ? (
          <CircleSpinner style={{ display: 'inline-block' }} />
        ) : null}
      </div>
      {renameMutation.isError ? (
        <UIText kind="caption/regular" color="var(--negative-500)">
          {(renameMutation.error as Error | null)?.message || 'Unknown Error'}
        </UIText>
      ) : null}
    </VStack>
  );
}

function RemoveAddressConfirmationDialog({ wallet }: { wallet: BareWallet }) {
  return (
    <form
      method="dialog"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <VStack gap={8}>
        <Media
          image={
            <WalletAvatar address={wallet.address} size={32} borderRadius={4} />
          }
          text={
            <UIText kind="subtitle/l_med">
              <WalletDisplayName wallet={wallet} />
            </UIText>
          }
          detailText={null}
        />
        <UIText kind="body/s_reg">Do you want to remove this wallet?</UIText>
      </VStack>
      <HStack gap={12} style={{ marginTop: 'auto' }}>
        <Button value="cancel" kind="regular">
          Cancel
        </Button>
        <Button value="confirm">Yes</Button>
      </HStack>
    </form>
  );
}

export function WalletAccount() {
  const { address } = useParams();
  const [params] = useSearchParams();
  const groupId = params.get('groupId');
  invariant(
    groupId,
    'groupId is a required search-param for WalletAccount view'
  );
  invariant(address, 'Address param is required for WalletAccount view');
  const navigate = useNavigate();
  const {
    data: wallet,
    isLoading,
    refetch: refetchWallet,
  } = useQuery(
    `wallet/uiGetWalletByAddress/${address}`,
    () => walletPort.request('uiGetWalletByAddress', { address }),
    { useErrorBoundary: true }
  );
  const displayName = useProfileName({ address, name: wallet?.name || null });
  const removeAddressMutation = useMutation(
    () => walletPort.request('removeAddress', { address }),
    {
      useErrorBoundary: true,
      onSuccess() {
        refetchWallet();
        navigate(-1);
      },
    }
  );
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const nameInputId = useId();
  if (isLoading) {
    return <NavigationTitle title={null} />;
  }
  if (!wallet) {
    return (
      <>
        <NavigationTitle title={null} />
        <NotFoundPage />
      </>
    );
  }

  return (
    <PageColumn>
      <NavigationTitle title={displayName} />

      <BottomSheetDialog ref={dialogRef}>
        <RemoveAddressConfirmationDialog wallet={wallet} />
      </BottomSheetDialog>
      <PageTop />
      <VStack gap={24}>
        <Surface padding={12}>
          <VStack gap={8}>
            <Media
              image={
                <WalletAvatar
                  address={wallet.address}
                  size={36}
                  borderRadius={4}
                />
              }
              text={
                <PortfolioValue
                  address={wallet.address}
                  render={(entry) => (
                    <UIText kind="subtitle/l_med">
                      {entry.value ? (
                        <NeutralDecimals
                          parts={formatCurrencyToParts(
                            entry.value?.total_value || 0,
                            'en',
                            'usd'
                          )}
                        />
                      ) : (
                        NBSP
                      )}
                    </UIText>
                  )}
                />
              }
              detailText={null}
            />
            <UIText kind="caption/reg" color="var(--neutral-500)">
              <div>{wallet.address}</div>
              {wallet.mnemonic ? (
                <div>Derivation path: {wallet.mnemonic?.path}</div>
              ) : null}
            </UIText>
          </VStack>
        </Surface>
        <InputDecorator
          label="Name"
          htmlFor={nameInputId}
          inputTextKind="body/accent"
          input={
            <EditableWalletName
              id={nameInputId}
              wallet={wallet}
              onRename={refetchWallet}
            />
          }
        />
        <VStack gap={8}>
          <UIText kind="subtitle/s_reg" color="var(--neutral-500)">
            Export Wallet
          </UIText>
          <SurfaceList
            items={[
              {
                key: 0,
                to: `/backup-wallet?${new URLSearchParams({
                  groupId,
                  address: wallet.address,
                  backupKind: 'reveal',
                })}`,
                component: (
                  <HStack
                    gap={4}
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <UIText kind="body/s_reg">Private key</UIText>
                    <span>
                      <ChevronRightIcon />
                    </span>
                  </HStack>
                ),
              },
            ]}
          />
        </VStack>

        <VStack gap={4}>
          <SurfaceList
            items={[
              {
                key: 0,
                onClick: () => {
                  if (!dialogRef.current) {
                    return;
                  }
                  showConfirmDialog(dialogRef.current).then(() => {
                    removeAddressMutation.mutate();
                  });
                },
                component: (
                  <HStack gap={8}>
                    <span style={{ color: 'var(--negative-500)' }}>
                      Remove Address{' '}
                    </span>
                  </HStack>
                ),
              },
            ]}
          />
          <UIText kind="caption/reg" color="var(--neutral-500)">
            You can always import it again using recovery phrase or a private
            key
          </UIText>
        </VStack>
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}
