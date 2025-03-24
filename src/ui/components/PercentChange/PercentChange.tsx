import type { PercentChangeInfo } from 'src/shared/units/formatPercent/formatPercentChange';
import { formatPercentChange } from 'src/shared/units/formatPercent/formatPercentChange';

export function PercentChange({
  value,
  locale,
  render,
}: {
  value: number | null;
  locale: string;
  render: (changeInfo: PercentChangeInfo) => JSX.Element;
}): JSX.Element | null {
  if (value == null) {
    return null;
  }
  return render(formatPercentChange(value, locale));
}
