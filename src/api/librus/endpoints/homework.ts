import { librusGet } from '../client';
import type { LibrusHomework, LibrusUser } from '../types';

interface HomeWorksResponse {
  HomeWorks: LibrusHomework[];
}

interface UserResponse {
  User: LibrusUser;
}

export function getLibrusHomeworks(accessToken: string): Promise<LibrusHomework[]> {
  return librusGet<HomeWorksResponse>(accessToken, '/HomeWorks').then((r) => r.HomeWorks);
}

export function getLibrusUser(accessToken: string, userId: number): Promise<LibrusUser> {
  return librusGet<UserResponse>(accessToken, `/Users/${userId}`).then((r) => r.User);
}
