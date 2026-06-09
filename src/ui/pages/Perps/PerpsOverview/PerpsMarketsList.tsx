import React, { useMemo, useState } from 'react';
import SearchIcon from 'jsx:src/ui/assets/search.svg';
import ChevronDownIcon from 'jsx:src/ui/assets/chevron-down.svg';
import type { DexIdentifier } from 'src/modules/hyperliquid/api/requests/perp-dexs.types';
import { usePerpMarkets } from 'src/modules/hyperliquid/hooks/usePerpMarkets';
import {
  DEFAULT_SORTING,
  selectPerps,
  type PerpSortField,
  type PerpSorting,
} from 'src/modules/hyperliquid/selectPerps';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { PerpsMarketRow } from './PerpsMarketRow';
import { PerpsSortDialog } from './PerpsSortDialog';

// Matches the history list's page size in PerpsOverview.
const PAGE_SIZE = 50;

const SORT_LABEL: Record<PerpSortField, string> = {
  volume: 'By Volume',
  price: 'By Price',
  change: 'By Change',
};

export function PerpsMarketsList({
  dexList,
  positionsLoading,
}: {
  dexList: DexIdentifier[];
  positionsLoading: boolean;
}) {
  const [sorting, setSorting] = useState<PerpSorting>(DEFAULT_SORTING);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sortDialog = useDialog2();

  // Don't fetch markets until positions have finished loading — positions
  // render first, markets are supplementary (see CONTEXT.md / ADR-0002).
  const markets = usePerpMarkets(dexList, { enabled: !positionsLoading });

  const allPerps = useMemo(
    () => selectPerps(markets.data, { sorting }),
    [markets.data, sorting]
  );
  const perps = useMemo(() => allPerps.slice(0, visible), [allPerps, visible]);
  const hasMore = visible < allPerps.length;

  // Supplementary section: absent while positions load, while markets load, or
  // when there's nothing to show. No skeleton, no empty/error state.
  if (positionsLoading || markets.isLoading || allPerps.length === 0) {
    return null;
  }

  return (
    <>
      <VStack gap={4}>
        <HStack gap={8} alignItems="center" style={{ paddingInline: 16 }}>
          <Button
            kind="regular"
            size={36}
            type="button"
            onClick={sortDialog.openDialog}
            aria-label="Sort markets"
            title="Sort markets"
            style={{ paddingInline: 12 }}
          >
            <HStack gap={4} alignItems="center">
              <span>{SORT_LABEL[sorting.field]}</span>
              <ChevronDownIcon style={{ width: 16, height: 16 }} />
            </HStack>
          </Button>
          <Button
            kind="regular"
            size={36}
            as={UnstyledLink}
            to="/search"
            aria-label="Search markets"
            title="Search markets"
            style={{ paddingInline: 8 }}
          >
            <SearchIcon style={{ display: 'block', width: 20, height: 20 }} />
          </Button>
        </HStack>
        <VStack gap={0}>
          {perps.map((perp, index) => (
            <React.Fragment key={perp.id}>
              {index > 0 ? (
                <div
                  style={{
                    backgroundColor: 'var(--neutral-200)',
                    height: 1,
                    marginInline: 8,
                  }}
                />
              ) : null}
              <PerpsMarketRow perp={perp} />
            </React.Fragment>
          ))}
        </VStack>
        {hasMore ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: 8,
            }}
          >
            <Button
              kind="regular"
              size={40}
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
            >
              Show more
            </Button>
          </div>
        ) : null}
      </VStack>
      <PerpsSortDialog
        open={sortDialog.open}
        onClose={sortDialog.closeDialog}
        sorting={sorting}
        onSelect={setSorting}
      />
    </>
  );
}
