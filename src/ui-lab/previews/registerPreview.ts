import type { PartiallyOptional } from 'src/shared/type-utils/PartiallyOptional';

export interface PreviewConfig {
  name: string;
  component: React.ReactNode | (() => React.ReactNode);
}

export const previews: PreviewConfig[] = [];

/**
 * Call this function near a component to place a preview
 * of it on the `/playground` route.
 * NOTE: Intended to be used during development and
 * should not be commited to final code. In order to create permanent previews
 * use the `registerPreviewPermanent` function
 */
export function registerPreview(
  preview: PartiallyOptional<PreviewConfig, 'name'>
) {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  previews.push({
    ...preview,
    name: preview.name ?? `Preview #${previews.length}`,
  });
}

export function registerPreviewPermanent(preview: PreviewConfig) {
  previews.push(preview);
}
