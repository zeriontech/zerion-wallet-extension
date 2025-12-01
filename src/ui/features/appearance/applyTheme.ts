import s from 'src/ui/style/theme.module.css';
import { Theme } from './Theme';

export function applyTheme(theme: Theme) {
  if (theme === Theme.dark) {
    document.documentElement.classList.add(s['theme-dark']);
    document.documentElement.style.setProperty(
      '--default-background',
      '#16161a'
    );
  } else {
    document.documentElement.classList.remove(s['theme-dark']);
    document.documentElement.style.setProperty('--default-background', 'white');
  }
}
