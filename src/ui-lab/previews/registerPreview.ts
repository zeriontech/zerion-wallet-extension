import type { PartiallyOptional } from 'src/shared/type-utils/PartiallyOptional';

interface PreviewConfig {
  name: string;
  component: React.ReactNode;
}

export const previews: PreviewConfig[] = [];

/**
 * Call this function near a component to place a preview
 * of it on the /playground route
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
