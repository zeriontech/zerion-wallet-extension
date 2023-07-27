export const TABS_OFFSET_METER_ID = 'overview-tabs-offset-meter';
export const TABS_OFFSET = 72;

export function getTabsOffset() {
  return (
    (document.getElementById(TABS_OFFSET_METER_ID)?.offsetTop || 0) -
    TABS_OFFSET
  );
}
