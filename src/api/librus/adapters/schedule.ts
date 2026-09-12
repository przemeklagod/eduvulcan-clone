import { getLibrusTimetable } from '../endpoints/schedule';
import type { LibrusTimetableLesson } from '../types';
import type { Schedule } from '../../hebe/types/schedule';

function adaptLesson(dateAt: string, lesson: LibrusTimetableLesson): Schedule {
  const timetableEntryId = Number(lesson.TimetableEntry.Id);
  const virtualClassId = Number(lesson.VirtualClass?.Id ?? 0);
  const cancelled = lesson.IsCanceled || lesson.IsSubstitutionClass;

  return {
    Id: timetableEntryId,
    DateAt: dateAt,
    TimeSlot: {
      Id: timetableEntryId,
      Start: lesson.HourFrom,
      End: lesson.HourTo,
      Display: `${lesson.HourFrom} - ${lesson.HourTo}`,
      Position: Number(lesson.LessonNo),
    },
    Subject: lesson.Subject
      ? { Id: lesson.Subject.Id, Key: String(lesson.Subject.Id), Name: lesson.Subject.Name, Kod: lesson.Subject.Short, Position: 0 }
      : undefined,
    TeacherPrimary: lesson.Teacher
      ? {
          Id: lesson.Teacher.Id,
          Surname: lesson.Teacher.LastName,
          Name: lesson.Teacher.FirstName,
          DisplayName: `${lesson.Teacher.FirstName} ${lesson.Teacher.LastName}`,
        }
      : undefined,
    Clazz: {
      Id: virtualClassId,
      Key: String(virtualClassId),
      DisplayName: lesson.VirtualClassName ?? '',
      Symbol: lesson.VirtualClassName ?? '',
    },
    Substitution: cancelled
      ? {
          Id: timetableEntryId,
          UnitId: 0,
          ScheduleId: timetableEntryId,
          DateAt: dateAt,
          ClassAbsence: lesson.IsCanceled,
          NoRoom: false,
          ModifiedAt: dateAt,
          Reason: lesson.SubstitutionNote ?? undefined,
        }
      : undefined,
  };
}

/**
 * Adapts Librus's Timetable[date][slot][lesson] shape into the same flat
 * Schedule[] the Vulcan side already produces, so schedule/index.tsx needs
 * no changes. Unlike Grades, Librus's timetable entries already carry
 * inline Subject/Teacher names - no separate lookup call needed.
 */
export async function getScheduleAdapted(accessToken: string, weekStart: string): Promise<Schedule[]> {
  const { Timetable } = await getLibrusTimetable(accessToken, weekStart);

  const result: Schedule[] = [];
  for (const [dateAt, slots] of Object.entries(Timetable)) {
    for (const slot of slots) {
      for (const lesson of slot) {
        result.push(adaptLesson(dateAt, lesson));
      }
    }
  }
  return result;
}
