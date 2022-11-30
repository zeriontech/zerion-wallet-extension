import 'normalize.css';
import 'src/ui/style/theme.module.css';
import 'src/ui/style/fonts.module.css';
import * as styles from 'src/ui/style/global.module.css';
import { useLayoutEffect } from 'react';
import type { TemplateType } from 'src/ui/shared/getPageTemplateName';

export function DesignTheme({ templateType }: { templateType: TemplateType }) {
  useLayoutEffect(() => {
    if (templateType === 'dialog') {
      document.body.classList.add(styles.isDialog);
      return () => {
        document.body.classList.remove(styles.isDialog);
      };
    }
  }, [templateType]);
  return null;
}
