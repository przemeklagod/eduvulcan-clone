import { hebeGet } from '../client';
import type { HebeCredential } from '../client';
import { fullSyncQuery } from '../pagination';
import type { Note } from '../types/note';

export function getNotes(credential: HebeCredential, params: { pupilId: number }): Promise<Note[]> {
  return hebeGet<Note[]>(credential, 'mobile/note/byPupil', fullSyncQuery(params));
}
