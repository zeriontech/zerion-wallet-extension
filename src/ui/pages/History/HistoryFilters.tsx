import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParamsObj } from 'src/ui/shared/forms/useSearchParamsObj';
import type { ActionType } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import SettingsIcon from 'jsx:src/ui/assets/settings-sliders.svg';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import CheckmarkIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import { NetworkSelect } from 'src/ui/pages/Networks/NetworkSelect/NetworkSelect';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import { createChain } from 'src/modules/networks/Chain';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import AllNetworksIcon from 'jsx:src/ui/assets/all-networks.svg';
import { HistoryDaySelector } from './HistoryDaySelector';
import * as styles from './styles.module.css';

export type HistorySearchParams = Record<string, string | undefined> & {
  date?: string;
  chain?: string;
  actionTypes?: string;
  assetTypes?: string;
};

const NAMED_ACTION_TYPES = ['trade', 'mint', 'send', 'receive'] as const;
type NamedActionType = (typeof NAMED_ACTION_TYPES)[number];

const OTHERS_ACTION_TYPES: ActionType[] = [
  'execute',
  'burn',
  'deposit',
  'withdraw',
  'approve',
  'revoke',
  'deploy',
  'cancel',
  'borrow',
  'repay',
  'stake',
  'unstake',
  'claim',
  'batch_execute',
];

const ACTION_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'trade', label: 'Trade' },
  { value: 'mint', label: 'Mint' },
  { value: 'send', label: 'Send' },
  { value: 'receive', label: 'Receive' },
  { value: 'others', label: 'Others' },
];

const ASSET_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Assets' },
  { value: 'nft', label: 'NFTs' },
  { value: 'fungible', label: 'Tokens' },
];

function parseActionTypes(param?: string): ActionType[] {
  if (!param) return [];
  const keys = param.split(',');
  const result: ActionType[] = [];
  for (const key of keys) {
    if (key === 'others') {
      result.push(...OTHERS_ACTION_TYPES);
    } else if (NAMED_ACTION_TYPES.includes(key as NamedActionType)) {
      result.push(key as ActionType);
    }
  }
  return result;
}

function parseActionTypeKeys(param?: string): string[] {
  if (!param) return [];
  return param.split(',').filter(Boolean);
}

function parseAssetTypes(param?: string): ('fungible' | 'nft')[] {
  if (!param) return [];
  if (param === 'fungible' || param === 'nft') return [param];
  return [];
}

export function useHistoryFilterParams() {
  const [searchParams, setSearchParams] =
    useSearchParamsObj<HistorySearchParams>();

  const actionTypeKeys = useMemo(
    () => parseActionTypeKeys(searchParams.actionTypes),
    [searchParams.actionTypes]
  );

  const actionTypes = useMemo(
    () => parseActionTypes(searchParams.actionTypes),
    [searchParams.actionTypes]
  );

  const assetTypes = useMemo(
    () => parseAssetTypes(searchParams.assetTypes),
    [searchParams.assetTypes]
  );

  const hasActiveFilters = Boolean(
    searchParams.actionTypes || searchParams.assetTypes
  );

  return {
    searchParams,
    setSearchParams,
    actionTypes,
    actionTypeKeys,
    assetTypes,
    assetTypeParam: searchParams.assetTypes,
    hasActiveFilters,
  };
}

function getActionTypeLabel(keys: string[]): string {
  if (!keys.length) return 'All Types';
  if (keys.length === 1) {
    const option = ACTION_TYPE_OPTIONS.find((o) => o.value === keys[0]);
    return option?.label ?? 'All Types';
  }
  return `${keys.length} Types`;
}

function getAssetTypeLabel(param?: string): string {
  if (!param || param === 'all') return 'All Assets';
  const option = ASSET_TYPE_OPTIONS.find((o) => o.value === param);
  return option?.label ?? 'All Assets';
}

function FilterRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <UnstyledButton
      onClick={onClick}
      style={{ width: '100%', padding: '12px', textAlign: 'left' }}
    >
      <HStack
        gap={4}
        justifyContent="space-between"
        alignItems="center"
        style={{ gridTemplateColumns: '1fr auto' }}
      >
        <UIText kind="body/regular">{label}</UIText>
        <ChevronRightIcon
          style={{
            display: 'block',
            width: 24,
            height: 24,
            color: 'var(--neutral-400)',
          }}
        />
      </HStack>
    </UnstyledButton>
  );
}

function AssetTypeDialog({
  value,
  onSelect,
  onClose,
}: {
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const open = useCallback(() => {
    if (!dialogRef.current) return;
    showConfirmDialog(dialogRef.current)
      .then((selected) => {
        onSelect(selected);
        onClose();
      })
      .catch(() => {});
  }, [onSelect, onClose]);

  return (
    <>
      <FilterRow label={getAssetTypeLabel(value)} onClick={open} />
      <BottomSheetDialog
        ref={dialogRef}
        height="min-content"
        containerStyle={{ backgroundColor: 'var(--neutral-100)' }}
        renderWhenOpen={() => (
          <>
            <DialogTitle
              alignTitle="start"
              title={<UIText kind="headline/h3">Asset Type</UIText>}
            />
            <Spacer height={16} />
            <form method="dialog">
              <SurfaceList
                style={{
                  paddingBlock: 12,
                  paddingInline: 8,
                  ['--surface-background-color' as string]: 'var(--white)',
                }}
                items={ASSET_TYPE_OPTIONS.map((option) => ({
                  key: option.value,
                  pad: false,
                  style: { padding: 0 },
                  component: (
                    <UnstyledButton
                      type="submit"
                      value={option.value}
                      className={styles.filterOption}
                    >
                      <HStack
                        gap={4}
                        justifyContent="space-between"
                        alignItems="center"
                        style={{ gridTemplateColumns: '1fr auto' }}
                      >
                        <UIText
                          kind="body/regular"
                          color={
                            value === option.value
                              ? 'var(--primary)'
                              : undefined
                          }
                        >
                          {option.label}
                        </UIText>
                        {value === option.value ? (
                          <CheckmarkIcon
                            style={{
                              width: 24,
                              height: 24,
                              color: 'var(--primary)',
                            }}
                          />
                        ) : null}
                      </HStack>
                    </UnstyledButton>
                  ),
                }))}
              />
            </form>
          </>
        )}
      />
    </>
  );
}

function ActionTypeDialogContent({
  dialogRef,
  initialKeys,
}: {
  dialogRef: React.RefObject<HTMLDialogElementInterface | null>;
  initialKeys: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialKeys)
  );

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleApply = () => {
    if (dialogRef.current) {
      dialogRef.current.returnValue = Array.from(selected).join(',');
      dialogRef.current.close();
    }
  };

  return (
    <>
      <DialogTitle
        alignTitle="start"
        title={<UIText kind="headline/h3">Transaction Type</UIText>}
      />
      <Spacer height={16} />
      <SurfaceList
        style={{
          paddingBlock: 12,
          ['--surface-background-color' as string]: 'var(--white)',
        }}
        items={ACTION_TYPE_OPTIONS.map((option) => ({
          key: option.value,
          isInteractive: true,
          pad: false,
          onClick: () => toggle(option.value),
          component: (
            <HStack
              gap={4}
              justifyContent="space-between"
              alignItems="center"
              style={{ gridTemplateColumns: '1fr auto', padding: '12px 4px' }}
            >
              <UIText
                kind="body/regular"
                color={
                  selected.has(option.value) ? 'var(--primary)' : undefined
                }
              >
                {option.label}
              </UIText>
              {selected.has(option.value) ? (
                <CheckmarkIcon
                  style={{
                    width: 24,
                    height: 24,
                    color: 'var(--primary)',
                  }}
                />
              ) : null}
            </HStack>
          ),
        }))}
      />
      <Spacer height={24} />
      <Button
        onClick={handleApply}
        style={{ width: '100%' }}
        size={48}
        kind="primary"
      >
        Apply
      </Button>
    </>
  );
}

function ActionTypeDialog({
  selectedKeys,
  onApply,
  onClose,
}: {
  selectedKeys: string[];
  onApply: (keys: string[]) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const open = useCallback(() => {
    if (!dialogRef.current) return;
    showConfirmDialog(dialogRef.current)
      .then((result) => {
        onApply(result ? result.split(',').filter(Boolean) : []);
        onClose();
      })
      .catch(() => {});
  }, [onApply, onClose]);

  return (
    <>
      <FilterRow label={getActionTypeLabel(selectedKeys)} onClick={open} />
      <BottomSheetDialog
        ref={dialogRef}
        height="min-content"
        containerStyle={{ backgroundColor: 'var(--neutral-100)' }}
        renderWhenOpen={() => (
          <ActionTypeDialogContent
            dialogRef={dialogRef}
            initialKeys={selectedKeys}
          />
        )}
      />
    </>
  );
}

export function HistoryFiltersButton({
  hasActiveFilters,
  selectedChain,
  onChainChange,
  addressType,
  date,
  onDateChange,
  actionTypeKeys,
  assetTypeParam,
  onActionTypesChange,
  onAssetTypeChange,
  onResetAll,
}: {
  hasActiveFilters: boolean;
  selectedChain: string | null;
  onChainChange: (value: string | null) => void;
  addressType: BlockchainType | null;
  date: string | undefined;
  onDateChange: (date: Date | null) => void;
  actionTypeKeys: string[];
  assetTypeParam: string | undefined;
  onActionTypesChange: (keys: string[]) => void;
  onAssetTypeChange: (value: string) => void;
  onResetAll: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const hasAnyFilter =
    hasActiveFilters || Boolean(selectedChain) || Boolean(date);

  const handleOpen = () => {
    if (!dialogRef.current) return;
    dialogRef.current.showModal();
  };

  const handleClose = () => {
    if (dialogRef.current) {
      dialogRef.current.close();
    }
  };

  const chainValue = selectedChain || NetworkSelectValue.All;
  const showNetworkSelector = addressType === 'evm';

  return (
    <>
      <Button
        onClick={handleOpen}
        size={40}
        kind="neutral"
        style={{ paddingInline: 8, position: 'relative' }}
        title="Filters"
      >
        <SettingsIcon style={{ display: 'block', width: 20, height: 20 }} />
        {hasAnyFilter ? (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
            }}
          />
        ) : null}
      </Button>
      <BottomSheetDialog
        ref={dialogRef}
        height="min-content"
        containerStyle={{ backgroundColor: 'var(--neutral-100)' }}
        renderWhenOpen={() => (
          <div>
            <DialogTitle
              alignTitle="start"
              title={<UIText kind="headline/h3">Filters</UIText>}
            />
            <Spacer height={16} />
            <VStack gap={16}>
              {showNetworkSelector ? (
                <VStack gap={8}>
                  <UIText kind="small/accent" color="var(--neutral-500)">
                    Network
                  </UIText>
                  <SurfaceList
                    style={
                      selectedChain
                        ? { border: '2px solid var(--primary-300)' }
                        : undefined
                    }
                    items={[
                      {
                        key: 'network',
                        pad: false,
                        style: { padding: 0 },
                        component: (
                          <NetworkSelect
                            value={chainValue}
                            standard={addressType || 'evm'}
                            onChangeEffect={handleClose}
                            onChange={(value) => {
                              onChainChange(
                                value === NetworkSelectValue.All ? null : value
                              );
                            }}
                            showAllNetworksOption={true}
                            showEcosystemHint={false}
                            renderButton={({ openDialog, networks }) => {
                              const chain = selectedChain
                                ? createChain(selectedChain)
                                : null;
                              const chainName =
                                chain && networks
                                  ? networks.getChainName(chain)
                                  : null;
                              const network =
                                chain && networks
                                  ? networks.getByNetworkId(chain)
                                  : null;
                              return (
                                <UnstyledButton
                                  onClick={openDialog}
                                  style={{
                                    width: '100%',
                                    padding: '12px',
                                    textAlign: 'left',
                                  }}
                                >
                                  <HStack
                                    gap={8}
                                    alignItems="center"
                                    style={{
                                      gridTemplateColumns: 'auto 1fr auto',
                                    }}
                                  >
                                    {network ? (
                                      <NetworkIcon
                                        size={24}
                                        src={network.icon_url}
                                        name={network.name}
                                      />
                                    ) : (
                                      <AllNetworksIcon
                                        style={{ width: 24, height: 24 }}
                                        role="presentation"
                                      />
                                    )}
                                    <UIText kind="body/regular">
                                      {chainName || 'All Networks'}
                                    </UIText>
                                    <ChevronRightIcon
                                      style={{
                                        display: 'block',
                                        width: 24,
                                        height: 24,
                                        color: 'var(--neutral-400)',
                                      }}
                                    />
                                  </HStack>
                                </UnstyledButton>
                              );
                            }}
                          />
                        ),
                      },
                    ]}
                  />
                </VStack>
              ) : null}

              <VStack gap={8}>
                <UIText kind="small/accent" color="var(--neutral-500)">
                  Date
                </UIText>
                <SurfaceList
                  style={
                    date
                      ? { border: '2px solid var(--primary-300)' }
                      : undefined
                  }
                  items={[
                    {
                      key: 'date',
                      pad: false,
                      style: { padding: 0 },
                      component: (
                        <HistoryDaySelector
                          selectedDate={date ? new Date(`${date}T12:00:00`) : undefined}
                          minDate={new Date(2018, 0, 1)}
                          maxDate={new Date()}
                          onDateSelect={(date: Date | null) => {
                            onDateChange(date);
                            handleClose();
                          }}
                          style={{ width: '100%' }}
                          trigger={
                            <div
                              style={{
                                padding: '12px',
                                textAlign: 'left',
                              }}
                            >
                              <HStack
                                gap={4}
                                justifyContent="space-between"
                                alignItems="center"
                                style={{ gridTemplateColumns: '1fr auto' }}
                              >
                                <UIText kind="body/regular">
                                  {date || 'All Time'}
                                </UIText>
                                <ChevronRightIcon
                                  style={{
                                    display: 'block',
                                    width: 24,
                                    height: 24,
                                    color: 'var(--neutral-400)',
                                  }}
                                />
                              </HStack>
                            </div>
                          }
                        />
                      ),
                    },
                  ]}
                />
              </VStack>

              <VStack gap={8}>
                <UIText kind="small/accent" color="var(--neutral-500)">
                  Asset
                </UIText>
                <SurfaceList
                  style={
                    assetTypeParam
                      ? { border: '2px solid var(--primary-300)' }
                      : undefined
                  }
                  items={[
                    {
                      key: 'asset',
                      pad: false,
                      style: { padding: 0 },
                      component: (
                        <AssetTypeDialog
                          value={assetTypeParam || 'all'}
                          onSelect={onAssetTypeChange}
                          onClose={handleClose}
                        />
                      ),
                    },
                  ]}
                />
              </VStack>

              <VStack gap={8}>
                <UIText kind="small/accent" color="var(--neutral-500)">
                  Type
                </UIText>
                <SurfaceList
                  style={
                    actionTypeKeys.length
                      ? { border: '2px solid var(--primary-300)' }
                      : undefined
                  }
                  items={[
                    {
                      key: 'type',
                      pad: false,
                      style: { padding: 0 },
                      component: (
                        <ActionTypeDialog
                          selectedKeys={actionTypeKeys}
                          onApply={onActionTypesChange}
                          onClose={handleClose}
                        />
                      ),
                    },
                  ]}
                />
              </VStack>
            </VStack>

            <Spacer height={24} />
            <Button
              onClick={handleClose}
              style={{ width: '100%' }}
              size={48}
              kind="primary"
            >
              Show
            </Button>
            {hasAnyFilter ? (
              <>
                <Spacer height={8} />
                <Button
                  onClick={() => {
                    onResetAll();
                    handleClose();
                  }}
                  style={{ width: '100%' }}
                  size={48}
                  kind="neutral"
                >
                  Reset all filters
                </Button>
              </>
            ) : null}
          </div>
        )}
      />
    </>
  );
}
