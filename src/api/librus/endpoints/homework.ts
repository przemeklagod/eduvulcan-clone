import { librusGet } from '../client';
import type { LibrusHomework, LibrusHomeworkCategory, LibrusUser } from '../types';

interface HomeWorksResponse {
  HomeWorks: LibrusHomework[];
}

interface HomeworkCategoriesResponse {
  Categories: LibrusHomeworkCategory[];
}

interface UserResponse {
  User: LibrusUser;
}

export function getLibrusHomeworks(accessToken: string): Promise<LibrusHomework[]> {
  return librusGet<HomeWorksResponse>(accessToken, '/HomeWorks').then((r) => r.HomeWorks);
}

export function getLibrusHomeworkCategories(accessToken: string): Promise<LibrusHomeworkCategory[]> {
  return librusGet<HomeworkCategoriesResponse>(accessToken, '/HomeWorks/Categories').then((r) => r.Categories);
}

export function getLibrusUser(accessToken: string, userId: number): Promise<LibrusUser> {
  return librusGet<UserResponse>(accessToken, `/Users/${userId}`).then((r) => r.User);
}
