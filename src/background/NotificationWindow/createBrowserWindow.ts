import type { Windows } from 'webextension-polyfill';
import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';
import { getPopupUrl } from 'src/ui/shared/getPopupUrl';
import { urlContext, type WindowType } from 'src/ui/shared/UrlContext';

function makePopupRoute(route: string, windowType: WindowType) {
  const popupUrl = getPopupUrl();
  urlContext.set(popupUrl.searchParams, { windowType });
  popupUrl.hash = route;
  return popupUrl.toString();
}

const IS_WINDOWS = /windows/i.test(navigator.userAgent);
const BROWSER_HEADER = 80;
const DEFAULT_WINDOW_SIZE = {
  width: 425 + (IS_WINDOWS ? 14 : 0), // windows cuts the width
  height: 700,
};

export interface WindowProps {
  route: string;
  type: WindowType;
  search?: string;
  top?: number;
  left?: number;
  width?: number;
  height?: number | 'max';
}

export async function createBrowserWindow({
  top,
  left,
  width = DEFAULT_WINDOW_SIZE.width,
  height = DEFAULT_WINDOW_SIZE.height,
  route: initialRoute,
  search,
  type,
}: WindowProps) {
  const id = nanoid();
  const params = new URLSearchParams(search);
  params.append('windowId', String(id));

  const {
    top: currentWindowTop = 0,
    left: currentWindowLeft = 0,
    width: currentWindowWidth = 0,
  } = await browser.windows.getCurrent({
    windowTypes: ['normal'],
  } as Windows.GetInfo);

  const position = {
    top: Math.max(top ?? currentWindowTop + BROWSER_HEADER, 0),
    left: Math.max(left ?? currentWindowLeft + currentWindowWidth - width, 0),
  };

  let heightValue = DEFAULT_WINDOW_SIZE.height;
  if (height === 'max') {
    const currentWindow = await browser.windows.getCurrent();
    heightValue = Math.max(
      DEFAULT_WINDOW_SIZE.height,
      currentWindow.height ?? 0
    );
  } else {
    heightValue = height;
  }

  const { id: windowId } = await browser.windows.create({
    focused: true,
    url: makePopupRoute(`${initialRoute}?${params.toString()}`, type),
    type: type === 'dialog' ? 'popup' : 'normal',
    width,
    height: heightValue,
    ...position,
  });

  if (!windowId) {
    throw new Error('Window ID not received from the window API.');
  }

  return { id, windowId };
}
