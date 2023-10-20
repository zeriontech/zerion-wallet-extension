export enum PasswordStep {
  create = 'create',
  warning = 'warning',
  confirm = 'confirm',
}

export function assertPasswordStep(
  param: string
): asserts param is PasswordStep {
  if (param in PasswordStep === false) {
    throw new Error('Unsupported step parameter');
  }
}
