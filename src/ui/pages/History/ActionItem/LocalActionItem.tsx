import React, { useMemo, useRef } from 'react';
import type { LocalAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import {
  applyLocalActionContent,
  buildActionContent,
  type LocalActionContentRequest,
} from 'src/modules/ethereum/transactions/addressAction/creators';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useHasBeenInView } from 'src/ui/shared/useHasBeenInView';
import { useLocalActionAsset } from '../localActionContent';
import { ActionItem } from './ActionItem';

/**
 * A local action whose content still needs an asset lookup. The lookup starts
 * only once the row is near the viewport, so a long local history costs
 * requests for what the user actually scrolls to.
 */
export function LocalActionItem({
  addressAction,
  contentRequest,
  testnetMode,
}: {
  addressAction: LocalAddressAction;
  contentRequest: LocalActionContentRequest;
  testnetMode: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hasBeenInView = useHasBeenInView(ref);
  const source = useHttpClientSource();
  const { data: asset } = useLocalActionAsset(contentRequest, source, {
    enabled: hasBeenInView,
  });

  const resolvedAction = useMemo(() => {
    if (!asset) {
      return addressAction;
    }
    const content = buildActionContent(
      contentRequest.transactionAction,
      asset,
      contentRequest.assetQuery.currency
    );
    return applyLocalActionContent(addressAction, contentRequest, content);
  }, [addressAction, asset, contentRequest]);

  return (
    <div ref={ref}>
      <ActionItem addressAction={resolvedAction} testnetMode={testnetMode} />
    </div>
  );
}
