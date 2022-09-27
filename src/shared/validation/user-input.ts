export const PASSWORD_MIN_LENGTH = 6;

export function validate({ password }: { password: string }): {
  valid: boolean;
  message: string;
} {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      message: 'Password must have at least 6 characters',
    };
  }
  return { valid: true, message: '' };
}
