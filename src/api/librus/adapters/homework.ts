import { getLibrusSubjects } from '../endpoints/grades';
import { getLibrusHomeworks, getLibrusUser } from '../endpoints/homework';
import type { LibrusUser } from '../types';
import type { Homework } from '../../hebe/types/homework';

const EMPTY_EMPLOYEE = { Id: 0, Surname: '', Name: '', DisplayName: '' };

/**
 * Homework's Subject/CreatedBy are bare {Id,Url} refs (no inline name, unlike
 * Timetable's Subject/Teacher) - resolved here via /Subjects (shared with the
 * Grades adapter) and one /Users/{id} call per distinct teacher.
 */
export async function getHomeworkAdapted(accessToken: string): Promise<Homework[]> {
  const [homeworks, subjects] = await Promise.all([getLibrusHomeworks(accessToken), getLibrusSubjects(accessToken)]);
  const subjectById = new Map(subjects.map((s) => [String(s.Id), s]));

  const teacherIds = [...new Set(homeworks.map((h) => String(h.CreatedBy.Id)))];
  const teachers = await Promise.all(teacherIds.map((id) => getLibrusUser(accessToken, Number(id)).catch(() => null)));
  const teacherById = new Map<string, LibrusUser>();
  teacherIds.forEach((id, i) => {
    const teacher = teachers[i];
    if (teacher) teacherById.set(id, teacher);
  });

  return homeworks.map((h): Homework => {
    const subject = subjectById.get(String(h.Subject.Id));
    const teacher = teacherById.get(String(h.CreatedBy.Id));

    return {
      Id: h.Id,
      Key: String(h.Id),
      IdPupil: 0,
      IdHomework: h.Id,
      Content: h.Content,
      IsAnswerRequired: false,
      CreatedAt: h.AddDate,
      ModifiedAt: h.AddDate,
      DateAt: h.Date,
      DeadlineAt: h.Date,
      Creator: teacher
        ? { Id: teacher.Id, Surname: teacher.LastName, Name: teacher.FirstName, DisplayName: `${teacher.FirstName} ${teacher.LastName}` }
        : EMPTY_EMPLOYEE,
      Subject: {
        Id: Number(subject?.Id ?? h.Subject.Id),
        Key: String(subject?.Id ?? h.Subject.Id),
        Name: subject?.Name ?? 'Przedmiot',
        Kod: '',
        Position: 0,
      },
      Attachments: [],
    };
  });
}
