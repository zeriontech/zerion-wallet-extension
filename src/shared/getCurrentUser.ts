import { BrowserStorage } from 'src/background/webapis/storage';
import type { User } from './types/User';

export const currentUserKey = 'currentUser';

export async function getCurrentUser() {
  return BrowserStorage.get<User>(currentUserKey);
}
