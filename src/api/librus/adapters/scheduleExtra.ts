import { getLibrusSubjects } from '../endpoints/grades';
import { getLibrusTimetable } from '../endpoints/schedule';
import type { LibrusTimetableLesson } from '../types';
import type { ScheduleExtra } from '../../hebe/types/schedule';

const EMPTY_EMPLOYEE = { Id: 0, Surname: '', Name: '', DisplayName: '' };

function adaptExtraLesson(dateAt: string, lesson: LibrusTimetableLesson): ScheduleExtra {
  const timetableEntryId = Number(lesson.TimetableEntry.Id);
  const description = lesson.Subject?.Name ?? '';

  return {
    Id: timetableEntryId,
    ScheduleExtraId: timetableEntryId,
    UnitId: 0,
    Type: 0,
    Year: Number(dateAt.slice(0, 4)),
    DateAt: dateAt,
    ExtraDescription: description,
    ScheduleDescription: description,
    SchedulePupilDescription: description,
    Teacher: lesson.Teacher
      ? {
          Id: lesson.Teacher.Id,
          Surname: lesson.Teacher.LastName,
          Name: lesson.Teacher.FirstName,
          DisplayName: `${lesson.Teacher.FirstName} ${lesson.Teacher.LastName}`,
        }
      : EMPTY_EMPLOYEE,
    TimeSlot: {
      Id: timetableEntryId,
      Start: lesson.HourFrom,
      End: lesson.HourTo,
      Display: `${lesson.HourFrom} - ${lesson.HourTo}`,
      Position: Number(lesson.LessonNo),
    },
  };
}

/**
 * Vulcan's "Zajęcia dodatkowe" (schedule-extra) is a separate API concept;
 * Librus instead flags individual /Subjects as IsExtracurricular - this
 * reuses the same Timetable fetch as the main Schedule adapter and filters
 * to lessons whose subject is flagged, rather than a dedicated endpoint.
 */
export async function getScheduleExtraAdapted(accessToken: string, weekStart: string): Promise<ScheduleExtra[]> {
  const [{ Timetable }, subjects] = await Promise.all([getLibrusTimetable(accessToken, weekStart), getLibrusSubjects(accessToken)]);
  const extracurricularSubjectIds = new Set(subjects.filter((s) => s.IsExtracurricular).map((s) => String(s.Id)));

  const result: ScheduleExtra[] = [];
  for (const [dateAt, slots] of Object.entries(Timetable)) {
    for (const slot of slots) {
      for (const lesson of slot) {
        if (lesson.Subject && extracurricularSubjectIds.has(String(lesson.Subject.Id))) {
          result.push(adaptExtraLesson(dateAt, lesson));
        }
      }
    }
  }
  return result;
}
