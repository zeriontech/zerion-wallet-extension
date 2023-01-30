import * as browserStorage from 'src/background/webapis/storage';
import { currentUserKey } from './storage-keys';
import type { User } from './types';

export async function getUserId() {
  const user = await browserStorage.get<User>(currentUserKey);
  return user?.id;
}
