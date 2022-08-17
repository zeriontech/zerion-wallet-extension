import React, { useCallback, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import ChevronRightIcon from 'src/ui/assets/chevron-right.svg';
import { PageBottom } from 'src/ui/components/PageBottom';
import { Surface } from 'src/ui/ui-kit/Surface';
import { getWalletDisplayName } from 'src/ui/shared/getWalletDisplayName';
import { Media } from 'src/ui/ui-kit/Media';
import { BlockieImg } from 'src/ui/components/BlockieImg';
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

function EditableWalletName({
  wallet,
  onRename,
}: {
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
    useCallback((value) => mutate(value), [mutate]),
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
          placeholder={getWalletDisplayName(wallet) || 'Account Name'}
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

function RemoveAddressConfirmationDialog({ wallet }: { wallet: BareWallet }) {
  return (
    <form
      method="dialog"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <VStack gap={8}>
        <Media
          image={<BlockieImg address={wallet.address} size={32} />}
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
  const navigate = useNavigate();
  if (!address) {
    throw new Error('Address param is required for this view');
  }
  const {
    data: wallet,
    isLoading,
    refetch: refetchWallet,
  } = useQuery(
    `wallet/uiGetWalletByAddress/${address}`,
    () => walletPort.request('uiGetWalletByAddress', { address }),
    { useErrorBoundary: true }
  );
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
      <NavigationTitle title={getWalletDisplayName(wallet)} />

      <BottomSheetDialog ref={dialogRef}>
        <RemoveAddressConfirmationDialog wallet={wallet} />
      </BottomSheetDialog>
      <PageTop />
      <VStack gap={24}>
        <Surface padding={12}>
          <VStack gap={8}>
            <Media
              image={<BlockieImg address={wallet.address} size={36} />}
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
        <Surface padding="10px 16px">
          <VStack gap={4}>
            <UIText kind="label/reg" color="var(--neutral-500)">
              Name
            </UIText>
            <UIText kind="body/s_reg">
              <EditableWalletName wallet={wallet} onRename={refetchWallet} />
            </UIText>
          </VStack>
        </Surface>
        <VStack gap={8}>
          <UIText kind="subtitle/s_reg" color="var(--neutral-500)">
            Export Wallet
          </UIText>
          <SurfaceList
            items={[
              {
                key: 0,
                to: '/not-implemented',
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
