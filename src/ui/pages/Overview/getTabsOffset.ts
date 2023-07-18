export const TABS_OFFSET_METER_ID = 'overview-tabs-offset-meter';
const TABS_HEIGHT = 47;

export function getTabsOffset() {
  return (
    (document.getElementById(TABS_OFFSET_METER_ID)?.offsetTop || 0) -
    TABS_HEIGHT
  );
}
