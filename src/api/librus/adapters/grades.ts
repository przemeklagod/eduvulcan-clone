import { getLibrusGradeCategories, getLibrusGrades, getLibrusSubjects } from '../endpoints/grades';
import type { Grade } from '../../hebe/types/grade';

// Librus's GradeCategory doesn't reliably expose a color, unlike Vulcan's -
// assign a stable one per category id from a small fixed palette instead of
// computing HSL math, so categories are visually distinct and consistent
// across app restarts.
const CATEGORY_COLOR_PALETTE = [0xd9534f, 0x5cb85c, 0x428bca, 0xf0ad4e, 0x9b59b6, 0x16a085, 0xe67e22, 0x2c3e50];

function colorForCategoryId(id: number): number {
  return CATEGORY_COLOR_PALETTE[Math.abs(id) % CATEGORY_COLOR_PALETTE.length];
}

const EMPTY_EMPLOYEE = { Id: 0, Surname: '', Name: '', DisplayName: '' };

/**
 * Adapts Librus's ApiRef-based Grade shape (Subject/Category are just {Id,Url}
 * references, resolved separately) into this app's existing Vulcan-shaped
 * Grade type, so grades/index.tsx needs no Librus-specific rendering code.
 * Field-name/shape guesses (Subject.Name, GradeCategory.Name) are unconfirmed
 * until tested live - see the plan's verification section.
 */
export async function getGradesAdapted(accessToken: string): Promise<Grade[]> {
  const [grades, subjects, categories] = await Promise.all([
    getLibrusGrades(accessToken),
    getLibrusSubjects(accessToken),
    getLibrusGradeCategories(accessToken),
  ]);

  const subjectById = new Map(subjects.map((s) => [String(s.Id), s]));
  const categoryById = new Map(categories.map((c) => [String(c.Id), c]));

  return grades.map((grade): Grade => {
    const subject = subjectById.get(String(grade.Subject.Id));
    const category = categoryById.get(String(grade.Category.Id));
    const categoryId = category ? Number(category.Id) : 0;

    return {
      Id: grade.Id,
      Key: String(grade.Id),
      PupilId: Number(grade.Student.Id),
      ContentRaw: grade.Grade,
      Content: grade.Grade,
      Comment: '',
      CreatedAt: grade.AddDate ?? grade.Date,
      ModifiedAt: grade.AddDate ?? grade.Date,
      Creator: EMPTY_EMPLOYEE,
      Modifier: EMPTY_EMPLOYEE,
      Column: {
        Id: categoryId,
        Key: String(categoryId),
        PeriodId: grade.Semester,
        Name: category?.Name ?? 'Ocena',
        Code: '',
        Group: '',
        Number: 0,
        Color: colorForCategoryId(categoryId),
        Weight: 0,
        Subject: {
          Id: Number(subject?.Id ?? grade.Subject.Id),
          Key: String(subject?.Id ?? grade.Subject.Id),
          Name: subject?.Name ?? 'Przedmiot',
          Kod: '',
          Position: 0,
        },
        Category: category ? { Id: Number(category.Id), Name: category.Name, Code: '' } : undefined,
      },
    };
  });
}
