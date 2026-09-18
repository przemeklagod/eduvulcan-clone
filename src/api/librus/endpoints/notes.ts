import { librusGet } from '../client';
import type { LibrusNote, LibrusNoteCategory } from '../types';

interface NotesResponse {
  Notes: LibrusNote[];
}

interface NoteCategoriesResponse {
  Categories: LibrusNoteCategory[];
}

export function getLibrusNotes(accessToken: string): Promise<LibrusNote[]> {
  return librusGet<NotesResponse>(accessToken, '/Notes').then((r) => r.Notes);
}

export function getLibrusNoteCategories(accessToken: string): Promise<LibrusNoteCategory[]> {
  return librusGet<NoteCategoriesResponse>(accessToken, '/Notes/Categories').then((r) => r.Categories);
}
