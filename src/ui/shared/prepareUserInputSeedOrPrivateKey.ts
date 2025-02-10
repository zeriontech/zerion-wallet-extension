export function prepareUserInputSeedOrPrivateKey(value: string) {
  return (value as string).trim().replace(/\s+/g, ' ');
}
