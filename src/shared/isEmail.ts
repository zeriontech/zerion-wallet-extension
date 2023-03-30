export function isEmail(email?: string) {
  return email && /.+@.+/.test(email);
}
