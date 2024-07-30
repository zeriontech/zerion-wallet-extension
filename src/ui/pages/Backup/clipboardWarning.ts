import { SeedType } from 'src/shared/SeedType';

export const clipboardWarning = {
  getMessage: (seedType: SeedType) => {
    const secretName =
      seedType === SeedType.privateKey ? 'private key' : 'recovery phrase';
    return `Did you save the ${secretName}?`;
  },
  isWarningMessage: (value: string) => value.startsWith('Did you save'),
};
