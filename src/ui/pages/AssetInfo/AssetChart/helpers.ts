import BigNumber from 'bignumber.js';
import { capitalize } from 'capitalize-ts';
import type { AssetChartActions } from 'src/modules/zerion-api/requests/asset-get-chart';
import type { Asset } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { ellipsis, minus } from 'src/ui/shared/typography';

function trimAssetSymbolForTooltip(symbol: string) {
  return symbol.length > 5 ? `${symbol.slice(0, 5)}${ellipsis}` : symbol;
}

export function serializeAssetChartActions({
  action,
  asset,
  currency,
}: {
  action: AssetChartActions['total'];
  asset: Asset;
  currency: string;
}) {
  return JSON.stringify({
    title: capitalize(action.type || 'total'),
    balance: `${
      new BigNumber(action.quantity).isPositive() ? '+' : minus
    }${formatTokenValue(
      new BigNumber(action.quantity).abs(),
      trimAssetSymbolForTooltip(asset.symbol),
      {
        notation: new BigNumber(action.quantity).gte(100000)
          ? 'compact'
          : undefined,
      }
    )}`,
    value: formatPriceValue(Math.abs(action.value), 'en', currency),
    direction: action.direction,
  });
}

export function deserializeAssetChartActions(data: string) {
  const parsedActions = JSON.parse(data);
  return {
    title: parsedActions.title as string,
    balance: parsedActions.balance as string,
    value: parsedActions.value as string,
    direction:
      parsedActions.direction as AssetChartActions['total']['direction'],
  };
}
