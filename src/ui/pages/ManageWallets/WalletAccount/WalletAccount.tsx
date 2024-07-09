import React, { useCallback, useId, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { Button } from 'src/ui/ui-kit/Button';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { WarningIcon } from 'src/ui/components/WarningIcon';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { invariant } from 'src/shared/invariant';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { InputDecorator } from 'src/ui/ui-kit/Input/InputDecorator';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import {
  ContainerType,
  getContainerType,
  isBareWallet,
  isDeviceAccount,
} from 'src/shared/types/validators';
import { getWalletGroupByAddress } from 'src/ui/shared/requests/getWalletGroupByAddress';
import { getError } from 'src/shared/errors/getError';
import { useCurrency } from 'src/modules/currency/useCurrency';

function EditableWalletName({
  id,
  wallet,
  onRename,
}: {
  id: string;
  wallet: ExternallyOwnedAccount;
  onRename?: () => void;
}) {
  const [value, setValue] = useState(wallet.name || '');
  const { mutate, ...renameMutation } = useMutation({
    mutationFn: (value: string) =>
      walletPort.request('renameAddress', {
        address: wallet.address,
        name: value,
      }),
    onSuccess() {
      onRename?.();
    },
  });
  const debouncedRenameRequest = useDebouncedCallback(
    useCallback((value: string) => mutate(value), [mutate]),
    500
  );

  const { value: displayName } = useProfileName(wallet);

  return (
    <VStack gap={4}>
      <div
        style={{
          display: 'grid',
          gap: 4,
          gridTemplateColumns: '1fr auto',
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

function RemoveAddressConfirmationDialog({
  containerType,
  wallet,
}: {
  containerType: ContainerType;
  wallet: ExternallyOwnedAccount;
}) {
  return (
    <form
      method="dialog"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <VStack gap={8}>
        <WarningIcon
          size={44}
          outlineStrokeWidth={7}
          borderWidth="3px"
          kind="negative"
          glow={true}
        />
        <UIText kind="headline/h3">Do you want to remove this wallet?</UIText>
        {containerType === ContainerType.readonly ? (
          <UIText kind="body/regular">
            You can always add it back to your watch list
          </UIText>
        ) : containerType === ContainerType.hardware ? (
          <UIText kind="body/regular">
            You can always add it again by connecting your hardware device
          </UIText>
        ) : (
          <UIText kind="body/regular">
            You can always import it again using your recovery phrase or private
            key
          </UIText>
        )}
        <Media
          image={
            <WalletAvatar address={wallet.address} size={32} borderRadius={4} />
          }
          text={
            <UIText kind="body/accent">
              <WalletDisplayName wallet={wallet} />
            </UIText>
          }
          detailText={null}
        />
      </VStack>
      <HStack
        gap={12}
        style={{ marginTop: 'auto', gridAutoColumns: '1fr 1fr' }}
      >
        <Button value="cancel" kind="regular" style={{ width: '100%' }}>
          Cancel
        </Button>
        <Button value="confirm" kind="danger" style={{ width: '100%' }}>
          Yes
        </Button>
      </HStack>
    </form>
  );
}

export function WalletAccount() {
  const { address } = useParams();
  const { currency } = useCurrency();
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
  } = useQuery({
    queryKey: ['wallet/uiGetWalletByAddress', address, groupId],
    queryFn: () =>
      walletPort.request('uiGetWalletByAddress', { address, groupId }),
    useErrorBoundary: true,
  });
  const { data: walletGroup, isLoading: walletGroupIsLoading } = useQuery({
    queryKey: ['getWalletGroupByAddress', address],
    queryFn: () => getWalletGroupByAddress(address),
  });
  const walletName = wallet?.name || null;
  const { value: displayName } = useProfileName({ address, name: walletName });
  const removeAddressMutation = useMutation({
    mutationFn: () => walletPort.request('removeAddress', { address, groupId }),
    useErrorBoundary: false,
    onSuccess() {
      refetchWallet();
      navigate(-1);
    },
  });
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const nameInputId = useId();
  if (isLoading || walletGroupIsLoading) {
    return <NavigationTitle title={null} documentTitle="" />;
  }
  if (!wallet || !walletGroup) {
    return (
      <>
        <NavigationTitle title={null} documentTitle="" />
        <NotFoundPage />
      </>
    );
  }

  return (
    <PageColumn>
      <NavigationTitle title={displayName} />
      <BottomSheetDialog ref={dialogRef} style={{ height: '48vh' }}>
        <RemoveAddressConfirmationDialog
          containerType={getContainerType(walletGroup.walletContainer)}
          wallet={wallet}
        />
      </BottomSheetDialog>
      <PageTop />
      <VStack gap={16}>
        <Surface padding={12}>
          <VStack gap={8}>
            <Media
              image={
                <WalletAvatar
                  address={wallet.address}
                  size={44}
                  borderRadius={4}
                />
              }
              text={
                <PortfolioValue
                  address={wallet.address}
                  render={(entry) => (
                    <UIText kind="headline/h2">
                      {entry.value ? (
                        <NeutralDecimals
                          parts={formatCurrencyToParts(
                            entry.value?.total_value || 0,
                            'en',
                            currency
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
            <UIText kind="caption/regular" color="var(--neutral-500)">
              <div>{wallet.address}</div>
              {isBareWallet(wallet) && wallet.mnemonic ? (
                <div>Derivation path: {wallet.mnemonic?.path}</div>
              ) : null}
              {isDeviceAccount(wallet) ? (
                <div>HW Derivation path: {wallet.derivationPath}</div>
              ) : null}
            </UIText>
          </VStack>
        </Surface>
        <InputDecorator
          label="Name"
          htmlFor={nameInputId}
          input={
            <EditableWalletName
              id={nameInputId}
              wallet={wallet}
              onRename={refetchWallet}
            />
          }
        />
        {isBareWallet(wallet) ? (
          <VStack gap={8}>
            <UIText kind="small/accent" color="var(--neutral-500)">
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
                      <UIText kind="body/accent">Private key</UIText>
                      <ChevronRightIcon
                        style={{ color: 'var(--neutral-400)' }}
                      />
                    </HStack>
                  ),
                },
              ]}
            />
          </VStack>
        ) : null}

        <VStack gap={8}>
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
                  <UIText kind="body/accent" color="var(--negative-500)">
                    Remove Address
                  </UIText>
                ),
              },
            ]}
          />
          {removeAddressMutation.isError ? (
            <UIText kind="caption/regular" color="var(--negative-500)">
              {getError(removeAddressMutation.error).message}
            </UIText>
          ) : null}
          <UIText kind="caption/regular" color="var(--neutral-500)">
            You can always import it again using your recovery phrase or private
            key
          </UIText>
        </VStack>
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}
