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

type AssetChartPointAction = {
  title: string;
  balance: string;
  value: string;
  direction: AssetChartActions['total']['direction'];
};

export function serializeAssetChartActions({
  action,
  asset,
  currency,
}: {
  action: AssetChartActions['total'];
  asset: Asset;
  currency: string;
}) {
  const data: AssetChartPointAction = {
    title: capitalize(action.type || 'total'),
    balance: `${
      new BigNumber(action.quantity).isPositive() ? '+' : minus
    }${formatTokenValue(
      new BigNumber(action.quantity).abs(),
      trimAssetSymbolForTooltip(asset.symbol),
      {
        notation: new BigNumber(action.quantity).abs().gte(100000)
          ? 'compact'
          : undefined,
      }
    )}`,
    value: formatPriceValue(Math.abs(action.value), 'en', currency),
    direction: action.direction,
  };
  return JSON.stringify(data);
}

export function deserializeAssetChartActions(data: string) {
  return JSON.parse(data) as AssetChartPointAction;
}
