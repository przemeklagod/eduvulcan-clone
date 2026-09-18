import { getLibrusUser } from '../endpoints/homework';
import { getLibrusNoteCategories, getLibrusNotes } from '../endpoints/notes';
import type { LibrusUser } from '../types';
import type { Note } from '../../hebe/types/note';

const EMPTY_EMPLOYEE = { Id: 0, Surname: '', Name: '', DisplayName: '' };
const POSITIVE = 1;

/**
 * Librus's Positive is 3-way (0 negatywna, 1 pozytywna, 2 neutralna) - Vulcan
 * only distinguishes pochwała/uwaga, so "neutralna" collapses into the
 * "uwaga" (non-positive) bucket rather than getting its own category.
 */
export async function getNotesAdapted(accessToken: string): Promise<Note[]> {
  const [notes, categories] = await Promise.all([getLibrusNotes(accessToken), getLibrusNoteCategories(accessToken)]);
  const categoryById = new Map(categories.map((c) => [String(c.Id), c]));

  const teacherIds = [...new Set(notes.map((n) => n.Teacher?.Id).filter((id): id is number | string => id !== undefined).map(String))];
  const teachers = await Promise.all(teacherIds.map((id) => getLibrusUser(accessToken, Number(id)).catch(() => null)));
  const teacherById = new Map<string, LibrusUser>();
  teacherIds.forEach((id, i) => {
    const teacher = teachers[i];
    if (teacher) teacherById.set(id, teacher);
  });

  return notes.map((n): Note => {
    const category = n.Category ? categoryById.get(String(n.Category.Id)) : undefined;
    const teacher = n.Teacher ? teacherById.get(String(n.Teacher.Id)) : undefined;

    return {
      Id: n.Id,
      Key: String(n.Id),
      IdPupil: 0,
      Positive: n.Positive === POSITIVE,
      ValidAt: n.Date,
      ModifiedAt: n.Date,
      Creator: teacher
        ? { Id: teacher.Id, Surname: teacher.LastName, Name: teacher.FirstName, DisplayName: `${teacher.FirstName} ${teacher.LastName}` }
        : EMPTY_EMPLOYEE,
      Category: category ? { Id: category.Id, Name: category.CategoryName } : undefined,
      Content: n.Text,
    };
  });
}
