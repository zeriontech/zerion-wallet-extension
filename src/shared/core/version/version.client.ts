import { checkExisingData, getCurrentVersion } from './shared';

export async function checkVersion() {
  const [hasSomeData, storageVersion] = await Promise.all([
    checkExisingData(),
    getCurrentVersion(),
  ]);
  if (hasSomeData && storageVersion === 'no-version') {
    return {
      storageVersion: {
        mismatch: true,
        // action: storageVersion === 'no-version' ? 'clear-storage' : undefined,
        action: 'clear-storage',
      },
    };
  }
  return null;
}
