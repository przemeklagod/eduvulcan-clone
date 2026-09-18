import { getLibrusSubjects } from '../endpoints/grades';
import { getLibrusHomeworkCategories, getLibrusHomeworks, getLibrusUser } from '../endpoints/homework';
import type { LibrusHomework, LibrusHomeworkCategory, LibrusSubject, LibrusUser } from '../types';

export const EMPTY_EMPLOYEE = { Id: 0, Surname: '', Name: '', DisplayName: '' };

/**
 * Librus has one unified /HomeWorks feed for both take-home assignments and
 * planned tests/quizzes, distinguished only by (freeform, teacher-defined)
 * Category name - unlike Vulcan, which has entirely separate homework/exam
 * endpoints. Confirmed live: every /HomeWorks entry seen so far was actually
 * a "Kartkówka"/"Sprawdzian" - if this heuristic didn't split them out, the
 * Homework screen would show kartkówki as if they were assignments.
 */
export function isExamCategoryName(name: string | undefined): boolean {
  if (!name) return false;
  return /sprawdzian|kartków|popraw/i.test(name);
}

export interface HomeworkContext {
  homeworks: LibrusHomework[];
  subjectById: Map<string, LibrusSubject>;
  categoryById: Map<string, LibrusHomeworkCategory>;
  teacherById: Map<string, LibrusUser>;
}

/** Shared fetch+resolve step for both the Homework and Exams adapters, so each only filters+maps the part it wants. */
export async function loadHomeworkContext(accessToken: string): Promise<HomeworkContext> {
  const [homeworks, subjects, categories] = await Promise.all([
    getLibrusHomeworks(accessToken),
    getLibrusSubjects(accessToken),
    getLibrusHomeworkCategories(accessToken),
  ]);
  const subjectById = new Map(subjects.map((s) => [String(s.Id), s]));
  const categoryById = new Map(categories.map((c) => [String(c.Id), c]));

  const teacherIds = [...new Set(homeworks.map((h) => String(h.CreatedBy.Id)))];
  const teachers = await Promise.all(teacherIds.map((id) => getLibrusUser(accessToken, Number(id)).catch(() => null)));
  const teacherById = new Map<string, LibrusUser>();
  teacherIds.forEach((id, i) => {
    const teacher = teachers[i];
    if (teacher) teacherById.set(id, teacher);
  });

  return { homeworks, subjectById, categoryById, teacherById };
}
