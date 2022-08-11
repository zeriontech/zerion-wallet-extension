export function prepareUserInputSeedOrPrivateKey(value: string) {
  return (value as string).toLowerCase().trim().replace(/\s+/g, ' ');
}
