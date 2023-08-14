import { BUG_REPORT_BUTTON_HEIGHT } from 'src/ui/components/BugReportButton';

export const TABS_OFFSET_METER_ID = 'overview-tabs-offset-meter';
export const TABS_OFFSET = 72;
export const TABS_HEIGHT = 48;
export const TABS_PADDING = 16;
export const HISTORY_FILTERS_HEIGHT = 56;
const PAGE_BOTTOM_HEIGHT = 24;

export const HISTORY_STRETCHY_VIEW_HEIGHT = `calc(100vh - ${
  TABS_OFFSET +
  TABS_HEIGHT +
  HISTORY_FILTERS_HEIGHT +
  BUG_REPORT_BUTTON_HEIGHT +
  PAGE_BOTTOM_HEIGHT
}px)`;

export function getTabsOffset() {
  return (
    (document.getElementById(TABS_OFFSET_METER_ID)?.offsetTop || 0) -
    TABS_OFFSET
  );
}
