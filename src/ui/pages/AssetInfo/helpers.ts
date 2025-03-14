import { minus } from 'src/ui/shared/typography';

export function getColor(value?: number | null) {
  return !value
    ? 'var(--black)'
    : value > 0
    ? 'var(--positive-500)'
    : 'var(--negative-500)';
}

export function getSign(value?: number) {
  return !value ? '' : value > 0 ? '+' : minus;
}
