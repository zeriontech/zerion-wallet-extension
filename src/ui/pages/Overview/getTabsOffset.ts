import { BUG_REPORT_BUTTON_HEIGHT } from 'src/ui/components/BugReportButton';

export const TABS_OFFSET_METER_ID = 'overview-tabs-offset-meter';
export const TABS_OFFSET = 72;
export const TABS_HEIGHT = 64; // 48px + 16px padding
const HISTORY_FILTERS_HEIGHT = 56;
const CHAIN_SELECTOR_HEIGHT = 24;
const PAGE_BOTTOM = 24;

export const HISTORY_STRETCHY_VIEW_HEIGHT = `calc(100vh - ${
  TABS_OFFSET +
  TABS_HEIGHT +
  HISTORY_FILTERS_HEIGHT +
  BUG_REPORT_BUTTON_HEIGHT +
  PAGE_BOTTOM
}px)`;
export const STRETCHY_VIEW_HEIGHT = `calc(100vh - ${
  TABS_OFFSET + TABS_HEIGHT + BUG_REPORT_BUTTON_HEIGHT + PAGE_BOTTOM
}px)`;
export const STRETCHY_VIEW_HEIGHT_UNDER_CHAIN_SELECTOR = `calc(100vh - ${
  TABS_OFFSET +
  TABS_HEIGHT +
  CHAIN_SELECTOR_HEIGHT +
  BUG_REPORT_BUTTON_HEIGHT +
  PAGE_BOTTOM
}px)`;

export function getTabsOffset() {
  return (
    (document.getElementById(TABS_OFFSET_METER_ID)?.offsetTop || 0) -
    TABS_OFFSET
  );
}
