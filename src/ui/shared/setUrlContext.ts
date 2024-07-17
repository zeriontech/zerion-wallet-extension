import type { UrlContext } from './UrlContext';
import { UrlContextParam } from './UrlContext';

export function setUrlContext(
  searchParams: URLSearchParams,
  params: Partial<UrlContext>
) {
  if (params.windowLayout) {
    searchParams.set(UrlContextParam.windowLayout, params.windowLayout);
  }
  if (params.windowType) {
    searchParams.set(UrlContextParam.windowType, params.windowType);
  }
  if (params.appMode) {
    searchParams.set(UrlContextParam.appMode, params.appMode);
  }
}
