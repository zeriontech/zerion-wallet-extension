import { urlContext } from 'src/shared/UrlContext';
import { openHref } from './openUrl';

export function openHrefInTabIfSidepanel(event: React.MouseEvent) {
  if (urlContext.windowType === 'sidepanel') {
    // Bugfix: this is used to fix a bug where clicking external links while in sidepanel
    // reloads the UI
    // {openHref} will preventDefault the event and create browser tab via extension api
    openHref(event);
  }
}
