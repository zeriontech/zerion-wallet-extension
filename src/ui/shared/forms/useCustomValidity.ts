import { useEffect } from 'react';

export function useCustomValidity({
  ref,
  customValidity,
}: {
  ref: React.RefObject<HTMLInputElement | null>;
  customValidity: string;
}) {
  useEffect(() => {
    if (ref.current) {
      ref.current.setCustomValidity(customValidity);
    }
  }, [customValidity, ref]);
}
