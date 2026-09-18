import { EMPTY_EMPLOYEE, isExamCategoryName, loadHomeworkContext } from './homeworkShared';
import type { Exam } from '../../hebe/types/exam';

/** The exam-flagged half of Librus's /HomeWorks feed - see ./homework.ts and ./homeworkShared.ts for why the split exists. */
export async function getExamsAdapted(accessToken: string): Promise<Exam[]> {
  const { homeworks, subjectById, categoryById, teacherById } = await loadHomeworkContext(accessToken);

  return homeworks
    .filter((h) => isExamCategoryName(categoryById.get(String(h.Category.Id))?.Name))
    .map((h): Exam => {
      const subject = subjectById.get(String(h.Subject.Id));
      const category = categoryById.get(String(h.Category.Id));
      const teacher = teacherById.get(String(h.CreatedBy.Id));

      return {
        Id: h.Id,
        Key: String(h.Id),
        Type: category?.Name ?? 'Sprawdzian',
        TypeId: Number(h.Category.Id),
        Content: h.Content,
        CreatedAt: h.AddDate,
        ModifiedAt: h.AddDate,
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
        PupilId: 0,
      };
    });
}
