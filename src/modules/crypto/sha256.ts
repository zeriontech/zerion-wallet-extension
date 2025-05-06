import { getSHA256HexDigest } from './getSHA256HexDigest';

export async function sha256({
  password,
  salt,
}: {
  password: string;
  salt: string;
}) {
  return await getSHA256HexDigest(`${salt}:${password}`);
}
