import React, { useEffect, useRef, useState } from 'react';
import type { TransactionAssetFilter, TransactionTypeFilter } from 'defi-sdk';
import cn from 'classnames';
import FiltersIcon from 'jsx:src/ui/assets/filters.svg';
import BackIcon from 'jsx:src/ui/assets/arrow-left.svg';
import { Button } from 'src/ui/ui-kit/Button';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { invariant } from 'src/shared/invariant';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { HStack } from 'src/ui/ui-kit/HStack';
import { DialogCloseButton } from 'src/ui/ui-kit/ModalDialogs/DialogTitle/DialogCloseButton';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { AngleRightRow } from 'src/ui/components/AngleRightRow';
import * as styles from './styles.module.css';

interface ActionFilterValue {
  actionTypes?: TransactionTypeFilter[];
  assetTypes?: TransactionAssetFilter;
  chains?: string[];
}

type FilterView = 'assetTypes' | 'actionTypes' | 'chains';

const ASSET_TYPE_TO_TITLE: Record<TransactionAssetFilter, string> = {
  all: 'All Assets',
  token: 'Tokens',
  nft: 'NFTs',
};

const ASSET_TYPE_FILTER_OPTIONS: TransactionAssetFilter[] = [
  'all',
  'token',
  'nft',
];

function AssetTypeSelector({
  onGoBack,
}: {
  value?: TransactionAssetFilter;
  onChange(type: TransactionAssetFilter): void;
  onGoBack(): void;
}) {
  return (
    <VStack gap={16}>
      <HStack gap={12} alignItems="center">
        <Button
          kind="ghost"
          aria-label="Go back"
          onClick={onGoBack}
          size={40}
          style={{ padding: '8px 10px', minWidth: 40 }}
          type="button"
        >
          <BackIcon
            role="presentation"
            style={{ display: 'block', width: 20, height: 20 }}
          />
        </Button>
        <UIText kind="headline/h3">Assets</UIText>
      </HStack>
      <SurfaceList
        items={ASSET_TYPE_FILTER_OPTIONS.map((type) => ({
          key: type,
          component: (
            <UIText kind="body/regular">{ASSET_TYPE_TO_TITLE[type]}</UIText>
          ),
        }))}
      />
    </VStack>
  );
}

// function ActionTypeSelector() {
//   return null;
// }

function FilterSubpage({
  open,
  type,
  className,
  ...props
}: React.HTMLProps<HTMLDivElement> & {
  open: boolean;
  type: 'primary' | 'secondary';
}) {
  const initialOpenRef = useRef(open);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (initialOpenRef.current !== open) setTouched(true);
  }, [open]);

  return (
    <div
      {...props}
      className={cn(
        className,
        styles.subpage,
        open ? styles.open : styles.close,
        styles[type],
        touched ? undefined : styles.initialOpen
      )}
    />
  );
}

function ActionFilterDialog({
  view,
  onChangeView,
  value,
}: // onChange,
{
  view: FilterView | null;
  onChangeView(view: FilterView | null): void;
  value?: ActionFilterValue;
  onChange(value: ActionFilterValue): void;
}) {
  const [state, setState] = useState<ActionFilterValue>(value || {});

  return (
    <div style={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
      <FilterSubpage open={view === 'assetTypes'} type="secondary">
        <AssetTypeSelector
          onGoBack={() => onChangeView(null)}
          value={state?.assetTypes}
          onChange={(value) =>
            setState((current) => ({ ...current, assetTypes: value }))
          }
        />
      </FilterSubpage>
      <FilterSubpage open={!view} type="primary">
        <VStack gap={32}>
          <DialogCloseButton />
          <VStack gap={16}>
            <UIText kind="headline/h3">Filters</UIText>
            <VStack gap={8}>
              <UIText kind="small/accent" color="var(--neutral-500)">
                Asset
              </UIText>
              <SurfaceList
                items={[
                  {
                    key: 0,
                    onClick: () => onChangeView('assetTypes'),
                    component: (
                      <AngleRightRow>
                        <UIText kind="body/regular">All Assets</UIText>
                      </AngleRightRow>
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
                items={[
                  {
                    key: 0,
                    onClick: () => onChangeView('actionTypes'),
                    component: (
                      <AngleRightRow>
                        <UIText kind="body/regular">All Types</UIText>
                      </AngleRightRow>
                    ),
                  },
                ]}
              />
            </VStack>
            <VStack gap={8}>
              <UIText kind="small/accent" color="var(--neutral-500)">
                Network
              </UIText>
              <SurfaceList
                items={[
                  {
                    key: 0,
                    onClick: () => onChangeView('chains'),
                    component: (
                      <AngleRightRow>
                        <UIText kind="body/regular">All Networks</UIText>
                      </AngleRightRow>
                    ),
                  },
                ]}
              />
            </VStack>
          </VStack>
          <HStack gap={32} style={{ gridTemplateColumns: '1fr 1fr' }}>
            <form method="dialog" style={{ display: 'grid' }}>
              <Button kind="regular" value="cancel">
                Reset
              </Button>
            </form>
            <Button kind="primary">Save</Button>
          </HStack>
        </VStack>
      </FilterSubpage>
    </div>
  );
}

export function ActionFilters({
  value = {},
  onChange,
}: {
  value?: ActionFilterValue;
  onChange(value: ActionFilterValue): void;
}) {
  const [view, setView] = useState<FilterView | null>(null);
  const [show, setShow] = useState(false);
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const dialogHeight = !view ? 436 : view === 'assetTypes' ? 400 : 130;

  return (
    <>
      <BottomSheetDialog
        ref={dialogRef}
        style={{
          padding: 0,
          backgroundColor: 'var(--background)',
          ['--surface-background-color' as string]: 'var(--white)',
        }}
        height={dialogHeight}
      >
        {show ? (
          <ActionFilterDialog
            value={value}
            onChange={onChange}
            view={view}
            onChangeView={setView}
          />
        ) : null}
      </BottomSheetDialog>
      <Button
        kind="ghost"
        size={40}
        style={{ display: 'flex', paddingInline: 8, alignItems: 'center' }}
        onClick={() => {
          invariant(dialogRef.current, 'Dialog element not found');
          setShow(true);
          showConfirmDialog(dialogRef.current).finally(() => setShow(false));
        }}
      >
        <FiltersIcon style={{ width: 24, height: 24 }} />
      </Button>
    </>
  );
}
