import { BUG_REPORT_BUTTON_HEIGHT } from 'src/ui/components/BugReportButton';
import { Store } from 'store-unit';

const CONTROLS_HEADER_HEIGHT = 56;

export const offsetValues = new Store({
  connectionHeaderHeight: 0,
});

type State = (typeof offsetValues)['state'];

export function getStickyOffset(state: State) {
  return state.connectionHeaderHeight + CONTROLS_HEADER_HEIGHT;
}

export const TABS_OFFSET_METER_ID = 'overview-tabs-offset-meter';
export const TAB_SELECTOR_HEIGHT = 32;
export const TAB_TOP_PADDING = 16;
const TAB_BOTTOM_PADDING = 24; // similar to <PageBottom /> height

export function getTabScrollContentHeight(state: State) {
  return (
    getStickyOffset(state) + TAB_SELECTOR_HEIGHT + BUG_REPORT_BUTTON_HEIGHT
  );
}

export function getMinTabContentHeight(state: State) {
  return `calc(100vh - ${getTabScrollContentHeight(state)}px)`;
}

export function getGrownTabMaxHeight(state: State) {
  const TAB_CONTENT_OFFSET =
    getTabScrollContentHeight(state) + TAB_BOTTOM_PADDING + TAB_TOP_PADDING;
  return `calc(100vh - ${TAB_CONTENT_OFFSET}px)`;
}

export function getCurrentTabsOffset(state: State) {
  return (
    (document.getElementById(TABS_OFFSET_METER_ID)?.offsetTop || 0) -
    getStickyOffset(state)
  );
}
