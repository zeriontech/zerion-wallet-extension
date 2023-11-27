export function isNumeric(n: number | string) {
  return !Number.isNaN(Number(n) - parseFloat(n as string));
}
