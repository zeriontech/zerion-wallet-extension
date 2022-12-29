import { isTruthy } from 'is-truthy-ts';
import React, { useCallback, useId, useRef, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { SeedType } from 'src/shared/SeedType';
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { NotFoundPage } from 'src/ui/components/NotFoundPage';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { walletPort } from 'src/ui/shared/channels';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import { PortfolioValue } from 'src/ui/shared/requests/PortfolioValue';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { NBSP } from 'src/ui/shared/typography';
import { PageBottom } from 'src/ui/components/PageBottom';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { Button } from 'src/ui/ui-kit/Button';
import { WarningIcon } from 'src/ui/components/WarningIcon';
import { useWalletGroups } from 'src/ui/shared/requests/useWalletGroups';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { Surface } from 'src/ui/ui-kit/Surface';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { getGroupDisplayName } from 'src/ui/shared/getGroupDisplayName';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';

function noNulls<T>(arr: (T | null)[]) {
  return arr.filter(isTruthy);
}

function useWalletGroup({ groupId }: { groupId: string }) {
  return useQuery(
    `wallet/uiGetWalletGroup/${groupId}`,
    () => walletPort.request('uiGetWalletGroup', { groupId }),
    { useErrorBoundary: true }
  );
}

function EditableWalletGroupName({
  id,
  walletGroup,
  onRename,
}: {
  id?: string;
  walletGroup: WalletGroup;
  onRename?: () => void;
}) {
  const [value, setValue] = useState(walletGroup.name);
  const { mutate, ...renameMutation } = useMutation(
    (value: string) =>
      walletPort.request('renameWalletGroup', {
        groupId: walletGroup.id,
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
          placeholder="Group Name"
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
        <UIText kind="caption/reg" color="var(--negative-500)">
          {(renameMutation.error as Error | null)?.message || 'Unknown Error'}
        </UIText>
      ) : null}
    </VStack>
  );
}

function RemoveGroupConfirmationDialog({
  walletGroup,
}: {
  walletGroup: WalletGroup;
}) {
  return (
    <form
      method="dialog"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <VStack gap={8}>
        <WarningIcon kind="negative" glow={true} />
        <UIText kind="subtitle/l_med">
          Did you backup your recovery phrase?
        </UIText>
        <UIText kind="body/s_reg">
          You will need your recovery phrase to import this group of wallets in
          the future
        </UIText>
        <UIText kind="caption/reg" color="var(--neutral-500)">
          Wallets to remove
        </UIText>
        <VStack gap={4} style={{ maxHeight: 200, overflowY: 'auto' }}>
          {walletGroup.walletContainer.wallets.map((wallet) => (
            <Media
              key={wallet.address}
              image={
                <WalletAvatar
                  address={wallet.address}
                  size={16}
                  borderRadius={4}
                />
              }
              text={
                <UIText kind="caption/reg">
                  <WalletDisplayName wallet={wallet} maxCharacters={15} />
                </UIText>
              }
              detailText={null}
            />
          ))}
        </VStack>
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

export function WalletGroup() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  if (!groupId) {
    throw new Error('Group Id is required for this view');
  }
  const { data: walletGroup, refetch: refetchWalletGroup } = useWalletGroup({
    groupId,
  });
  const groupInputId = useId();
  const { refetch } = useWalletGroups();
  const removeWalletGroupMutation = useMutation(
    () => walletPort.request('removeWalletGroup', { groupId }),
    {
      useErrorBoundary: true,
      onSuccess() {
        refetch();
        navigate(-1);
      },
    }
  );
  if (!walletGroup) {
    return (
      <>
        <NavigationTitle title={null} />
        <NotFoundPage />
      </>
    );
  }
  const { seedType } = walletGroup.walletContainer;
  const strings = {
    recoveryPhraseTitle: 'Recovery Phrase',
    privateKeyTitle: 'Private Key',
    removeWalletSubtitle:
      seedType === SeedType.mnemonic
        ? 'You can always import it again using recovery phrase'
        : 'You can always import it again using a private key',
  };

  return (
    <PageColumn>
      <NavigationTitle title={getGroupDisplayName(walletGroup.name)} />
      <BottomSheetDialog ref={dialogRef}>
        <RemoveGroupConfirmationDialog walletGroup={walletGroup} />
      </BottomSheetDialog>
      <PageTop />
      <VStack gap={24}>
        {walletGroup.walletContainer.seedType === SeedType.mnemonic ? (
          <Surface
            padding="10px 16px"
            style={{ border: '1px solid var(--neutral-400)' }}
          >
            <VStack gap={4}>
              <UIText
                kind="label/reg"
                color="var(--neutral-500)"
                as="label"
                htmlFor={groupInputId}
              >
                Name
              </UIText>
              <UIText kind="body/s_reg">
                <EditableWalletGroupName
                  id={groupInputId}
                  walletGroup={walletGroup}
                  onRename={refetchWalletGroup}
                />
              </UIText>
            </VStack>
          </Surface>
        ) : null}
        <SurfaceList
          items={noNulls([
            {
              key: 1,
              to: `/backup-wallet?groupId=${walletGroup.id}&backupKind=verify`,
              component: (
                <HStack
                  gap={4}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <UIText kind="body/s_reg">
                    {seedType === SeedType.mnemonic
                      ? strings.recoveryPhraseTitle
                      : strings.privateKeyTitle}
                    {walletGroup.lastBackedUp != null ? (
                      <UIText kind="caption/reg" color="var(--neutral-500)">
                        Last Backup:{' '}
                        {new Intl.DateTimeFormat('en', {
                          dateStyle: 'medium',
                        }).format(walletGroup.lastBackedUp)}
                      </UIText>
                    ) : null}
                  </UIText>
                  <span>
                    <ChevronRightIcon />
                  </span>
                </HStack>
              ),
            },
          ])}
        />

        <SurfaceList
          items={[
            ...walletGroup.walletContainer.wallets.map((wallet) => ({
              key: wallet.address,
              to: `/wallets/accounts/${wallet.address}?groupId=${walletGroup.id}`,
              component: (
                <HStack
                  gap={4}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Media
                    image={
                      <WalletAvatar
                        address={wallet.address}
                        size={24}
                        borderRadius={4}
                      />
                    }
                    text={<WalletDisplayName wallet={wallet} />}
                    vGap={0}
                    detailText={
                      <PortfolioValue
                        address={wallet.address}
                        render={(entry) => (
                          <UIText kind="label/reg">
                            {entry.value
                              ? formatCurrencyValue(
                                  entry.value?.total_value || 0,
                                  'en',
                                  'usd'
                                )
                              : NBSP}
                          </UIText>
                        )}
                      />
                    }
                  />
                  <span>
                    <ChevronRightIcon />
                  </span>
                </HStack>
              ),
            })),
            {
              key: 1,
              to: `/get-started/import/mnemonic?groupId=${walletGroup.id}`,
              component: (
                <div style={{ color: 'var(--primary)' }}>+ Add Wallet</div>
              ),
            },
          ]}
        />
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
                    removeWalletGroupMutation.mutate();
                  });
                },
                component: (
                  <HStack gap={8}>
                    <span style={{ color: 'var(--negative-500)' }}>
                      Remove Group{' '}
                    </span>
                    {removeWalletGroupMutation.isLoading ? (
                      <CircleSpinner style={{ display: 'inline-block' }} />
                    ) : null}
                  </HStack>
                ),
              },
            ]}
          />
          <UIText kind="caption/reg" color="var(--neutral-500)">
            {strings.removeWalletSubtitle}
          </UIText>
        </VStack>
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}
