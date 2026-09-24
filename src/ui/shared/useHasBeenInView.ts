import { useEffect, useState } from 'react';

/**
 * Turns true once the element has come within `rootMargin` of the viewport
 * and stays true afterwards. Meant for deferring work (like data fetching)
 * until an item is about to be seen.
 */
export function useHasBeenInView(
  ref: React.RefObject<Element>,
  { rootMargin = '200px', enabled = true } = {}
) {
  const [hasBeenInView, setHasBeenInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!enabled || hasBeenInView || !node) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHasBeenInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, rootMargin, enabled, hasBeenInView]);

  return hasBeenInView;
}
