export enum ViewParam {
  password = 'password',
  secret = 'secret',
}

export function assertViewParam(param: string): asserts param is ViewParam {
  if (param in ViewParam === false) {
    throw new Error('Unsupported view parameter');
  }
}

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
