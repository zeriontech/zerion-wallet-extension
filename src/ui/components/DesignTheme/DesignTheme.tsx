import 'normalize.css';
import 'src/ui/style/theme.module.css';
import 'src/ui/style/fonts.module.css';
import { useLayoutEffect } from 'react';

export function DesignTheme({
  bodyClassList = [],
}: {
  bodyClassList?: string[];
}) {
  useLayoutEffect(() => {
    if (bodyClassList?.length) {
      document.body.classList.add(...bodyClassList);
      return () => {
        document.body.classList.remove(...bodyClassList);
      };
    }
  }, [bodyClassList]);
  return null;
}
