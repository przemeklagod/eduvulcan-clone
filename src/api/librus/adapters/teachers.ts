import { getLibrusTimetable } from '../endpoints/schedule';
import type { Teacher } from '../../hebe/types/teacher';

/**
 * Librus has no dedicated class-teacher-roster endpoint (confirmed absent
 * from the SDK, its OpenAPI specs, and source - searched for "wychowawca"/
 * homeroom too, nothing) - this derives a roster from one week's Timetable,
 * deduplicating (Teacher, Subject) pairs the same way Vulcan's own
 * Teacher.Description ties a teacher to what they teach this pupil. A
 * single week can miss a subject that meets less than weekly, and there's
 * no way to flag which teacher is the "wychowawca" at all - both are
 * limitations of what Librus's API exposes, not this adapter.
 */
export async function getTeachersAdapted(accessToken: string, weekStart: string): Promise<Teacher[]> {
  const { Timetable } = await getLibrusTimetable(accessToken, weekStart);

  const seen = new Set<string>();
  const teachers: Teacher[] = [];
  for (const slots of Object.values(Timetable)) {
    for (const slot of slots) {
      for (const lesson of slot) {
        if (!lesson.Teacher || !lesson.Subject) continue;
        const key = `${lesson.Teacher.Id}-${lesson.Subject.Name}`;
        if (seen.has(key)) continue;
        seen.add(key);

        teachers.push({
          Id: lesson.Teacher.Id,
          BoxId: '',
          Position: 0,
          Description: lesson.Subject.Name,
          Name: lesson.Teacher.FirstName,
          Surname: lesson.Teacher.LastName,
          DisplayName: `${lesson.Teacher.FirstName} ${lesson.Teacher.LastName}`,
        });
      }
    }
  }
  return teachers;
}
