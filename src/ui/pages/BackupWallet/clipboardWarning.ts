import { SeedType } from 'src/shared/SeedType';

export const clipboardWarning = {
  getMessage: (seedType: SeedType) => {
    const secretName =
      seedType === SeedType.privateKey ? 'private key' : 'recovery phrase';
    return `You can copy and paste ${secretName} from where you saved it`;
  },
  isWarningMessage: (value: string) =>
    value.startsWith('You can copy and paste'),
};
