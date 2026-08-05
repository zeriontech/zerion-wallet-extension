import { useEffect } from 'react';

/**
 * Injects `<link rel="preload" as="image">` tags for the given URLs into
 * `document.head` while the calling component is mounted, and removes them
 * on unmount.
 *
 * Use this instead of hardcoding `<link rel="preload">` tags in the HTML
 * entry files: a preload declared in HTML is fetched on every page load
 * regardless of whether the user ever reaches the screen that needs it,
 * which is exactly what triggers Chrome's "was preloaded but not used"
 * console warning. Calling this hook from the component that is about to
 * render the image (or from the screen shown right before it) preloads the
 * resource only when it is actually going to be used.
 */
export function usePreloadImages(urls: string[]) {
  useEffect(() => {
    const links = urls.map((url) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
      return link;
    });
    return () => {
      for (const link of links) {
        link.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls.join(',')]);
}
