export type BackupContext =
  | {
      appMode: 'onboarding';
    }
  | {
      appMode: 'wallet';
      groupId: string;
    };
