import type { AppMode, UrlContext, WindowLayout, WindowType } from './types/UrlContext';
import { UrlContextParam } from './types/UrlContext';

/**
 * The manifest owns the built side panel path: the bundler relocates the page
 * (Vite emits `ui/sidepanel.html`), so matching a literal prefix breaks
 * silently and the panel renders with the fixed-width popup layout.
 */
function getSidepanelPathname() {
  try {
    const manifest = globalThis.chrome?.runtime?.getManifest?.();
    const sidepanelPath = manifest?.side_panel?.default_path;
    return sidepanelPath ? `/${sidepanelPath}` : undefined;
  } catch {
    return undefined;
  }
}

function getWindowType(params: URLSearchParams): WindowType {
  const sidepanelPathname = getSidepanelPathname();
  const isSidepanelPath = sidepanelPathname
    ? window.location.pathname === sidepanelPathname
    : window.location.pathname.startsWith('/sidepanel');

  if (isSidepanelPath && params.get(UrlContextParam.windowType) !== 'tab') {
    return 'sidepanel';
  }
  return (params.get(UrlContextParam.windowType) as WindowType) || 'popup';
}

function getUrlContext(): UrlContext {
  const params = new URL(window.location.href).searchParams;
  return {
    appMode: (params.get(UrlContextParam.appMode) as AppMode) || 'wallet',
    windowType: getWindowType(params),
    windowLayout: (params.get(UrlContextParam.windowLayout) as WindowLayout) || 'column',
  };
}

export const urlContext = getUrlContext();
