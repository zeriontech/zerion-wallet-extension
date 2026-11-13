import React, { useMemo, useState } from 'react';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { normalizedContains } from 'src/shared/normalizedContains';
import { useBackgroundKind } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { Button } from 'src/ui/ui-kit/Button';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HStack } from 'src/ui/ui-kit/HStack';
import { SearchInput } from 'src/ui/ui-kit/Input/SearchInput';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useHiddenFungibleActions, useHiddenFungibleIds } from './useHiddenFungibles';
import { trackAssetVisibilityChanged } from './visibility';
import { useHiddenAssetFungibles } from './useHiddenAssetFungibles';

function matchesAsset(query: string, asset: Fungible | undefined, id: string) {
  if (!query) {
    return true;
  }
  const value = query.trim().toLowerCase();
  return Boolean(
    normalizedContains(id.toLowerCase(), value) ||
    (asset &&
      (normalizedContains(asset.name.toLowerCase(), value) ||
        normalizedContains(asset.symbol.toLowerCase(), value))),
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <VStack gap={8} style={{ padding: '48px 16px', textAlign: 'center' }}>
      <UIText kind="headline/h3">{title}</UIText>
      {subtitle ? (
        <UIText kind="body/regular" color="var(--neutral-500)">
          {subtitle}
        </UIText>
      ) : null}
    </VStack>
  );
}

export function HiddenAssets() {
  useBackgroundKind({ kind: 'white' });
  const { currency } = useCurrency();
  const { rawHiddenFungibleIds, hiddenFungibleIds } = useHiddenFungibleIds();
  const { unhide } = useHiddenFungibleActions();
  const [query, setQuery] = useState('');

  const assetsQuery = useHiddenAssetFungibles(hiddenFungibleIds, currency);
  const assetsById = useMemo(() => {
    return new Map((assetsQuery.data ?? []).map((asset) => [asset.id, asset]));
  }, [assetsQuery.data]);

  const rows = rawHiddenFungibleIds
    .map((id) => ({ id, asset: assetsById.get(id) }))
    .filter(({ id, asset }) => matchesAsset(query, asset, id));

  const unhideAsset = (id: string, asset: Fungible | undefined) => {
    const next = unhide(id);
    if (!next) {
      return;
    }
    trackAssetVisibilityChanged({
      isHidden: false,
      assetId: id,
      assetName: asset?.name,
      assetSymbol: asset?.symbol,
      entryPoint: 'list',
      screenName: 'Hidden Assets',
      hiddenAssetsCount: next.length,
    });
  };

  return (
    <PageColumn>
      <NavigationTitle title="Hidden Assets" />
      <PageTop />
      {rawHiddenFungibleIds.length > 0 ? (
        <SearchInput
          boxHeight={40}
          type="search"
          placeholder="Search"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
      ) : null}
      {rawHiddenFungibleIds.length === 0 ? (
        <EmptyState
          title="No hidden tokens yet"
          subtitle="Tokens you hide won't appear in your portfolio, but you can always find them here."
        />
      ) : assetsQuery.isLoading ? (
        <VStack gap={8} style={{ padding: 24, justifyItems: 'center' }}>
          <CircleSpinner />
        </VStack>
      ) : rows.length === 0 ? (
        <EmptyState title="No results found" />
      ) : (
        <SurfaceList
          style={{ marginTop: 8 }}
          items={rows.map(({ id, asset }) => ({
            key: id,
            component: (
              <HStack gap={8} alignItems="center" justifyContent="space-between">
                <UnstyledLink
                  to={`/asset/${encodeURIComponent(id)}`}
                  style={{ color: 'inherit', minWidth: 0, flexGrow: 1 }}
                >
                  <HStack gap={12} alignItems="center">
                    <TokenIcon
                      src={asset?.iconUrl}
                      symbol={asset?.symbol ?? '???'}
                      size={36}
                      title={asset?.name ?? id}
                    />
                    <VStack gap={0} style={{ minWidth: 0 }}>
                      <UIText
                        kind="body/accent"
                        style={{
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {asset?.name ?? 'Unknown token'}
                      </UIText>
                      <UIText
                        kind="small/regular"
                        color="var(--neutral-500)"
                        style={{
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {asset?.symbol ?? id}
                      </UIText>
                    </VStack>
                  </HStack>
                </UnstyledLink>
                <Button
                  kind="neutral"
                  size={36}
                  onClick={() => unhideAsset(id, asset)}
                  style={{ flexShrink: 0 }}
                >
                  Unhide
                </Button>
              </HStack>
            ),
          }))}
        />
      )}
      <PageBottom />
    </PageColumn>
  );
}
