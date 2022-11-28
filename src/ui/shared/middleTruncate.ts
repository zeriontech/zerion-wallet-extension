import { ellipsis } from './typography';

export const middleTruncate = ({
  value,
  leadingLettersCount = 3,
  trailingLettersCount = 6,
}: {
  value: string;
  leadingLettersCount?: number;
  trailingLettersCount?: number;
}) =>
  value.length > leadingLettersCount + trailingLettersCount
    ? `${value.slice(0, leadingLettersCount)}${ellipsis}${value.slice(
        -trailingLettersCount
      )}`
    : value;
