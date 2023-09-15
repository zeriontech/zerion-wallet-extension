export function getNameFromOrigin(origin: string) {
  return new URL(origin).hostname;
}
