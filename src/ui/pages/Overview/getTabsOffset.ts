import { BUG_REPORT_BUTTON_HEIGHT } from 'src/ui/components/BugReportButton';

export const TABS_OFFSET_METER_ID = 'overview-tabs-offset-meter';
export const TAB_STICKY_OFFSET = 72;
export const TAB_SELECTOR_HEIGHT = 48;
export const TAB_TOP_PADDING = 16;
const TAB_BOTTOM_PADDING = 24; // similar to <PageBottom /> height

const TAB_OFFSET =
  TAB_STICKY_OFFSET + TAB_SELECTOR_HEIGHT + BUG_REPORT_BUTTON_HEIGHT;
const TAB_CONTENT_OFFSET = TAB_OFFSET + TAB_BOTTOM_PADDING + TAB_TOP_PADDING;

export const MIN_TAB_CONTENT_HEIGHT = `calc(100vh - ${TAB_OFFSET}px)`;
export const GROWN_TAB_MAX_HEIGHT = `calc(100vh - ${TAB_CONTENT_OFFSET}px)`;

export function getTabsOffset() {
  return (
    (document.getElementById(TABS_OFFSET_METER_ID)?.offsetTop || 0) -
    TAB_STICKY_OFFSET
  );
}
