import { BrowserStorage } from 'src/background/webapis/storage';
import { currentUserKey } from 'src/shared/getCurrentUser';
import type { User } from 'src/shared/types/User';

export async function getUserId() {
  const user = await BrowserStorage.get<User>(currentUserKey);
  return user?.id;
}
