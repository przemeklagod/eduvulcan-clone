import { getLibrusAttendances, getLibrusAttendanceTypes } from '../endpoints/attendance';
import type { LibrusAttendance, LibrusAttendanceType } from '../types';
import type { Lesson } from '../../hebe/types/lesson';
import type { PresenceMonthStats, PresenceSubjectStats } from '../../hebe/types/presence';

// The 5 standard type ids are stable across Librus accounts (confirmed live):
// 1 = Nieobecność, 2 = Spóźnienie, 3 = Nieobecność usprawiedliwiona,
// 4 = Zwolnienie, 100 = Obecność. Custom types (e.g. "zdalne") carry a
// StandardType ref back to one of these.
const ABSENCE = 1;
const LATE = 2;
const ABSENCE_JUSTIFIED = 3;
const EXEMPTION = 4;

const EMPTY_EMPLOYEE = { Id: 0, Surname: '', Name: '', DisplayName: '' };
const EMPTY_CLAZZ = { Id: 0, Key: '', DisplayName: '', Symbol: '' };

function standardIdOf(type: LibrusAttendanceType | undefined): number | undefined {
  if (!type) return undefined;
  return type.Standard ? type.Id : type.StandardType ? Number(type.StandardType.Id) : type.Id;
}

export interface LibrusAttendanceAdapted {
  monthStats: PresenceMonthStats[];
  subjectStats: PresenceSubjectStats[];
  unexcusedAbsences: Lesson[];
}

/**
 * Librus's /Attendances has no date-range params - it returns the whole
 * semester to date, so there's no real "per month" breakdown to compute;
 * this produces a single school-year-to-date aggregate instead (the screen
 * only ever reads the last monthStats entry as "overall"). Per-subject
 * breakdown (subjectStats) is left empty: resolving it would require
 * fetching every historical week's Timetable to map Attendance.Lesson.Id -&gt;
 * Subject (Lesson ids are per-occurrence, not stable across weeks) - a
 * follow-up, not blocking this phase.
 */
export async function getAttendanceAdapted(accessToken: string): Promise<LibrusAttendanceAdapted> {
  const [attendances, types] = await Promise.all([getLibrusAttendances(accessToken), getLibrusAttendanceTypes(accessToken)]);
  const typeById = new Map(types.map((t) => [String(t.Id), t]));

  let presentCount = 0;
  let absences = 0;
  let absencesJustified = 0;
  let lateArrivals = 0;
  let exemptions = 0;
  const unexcusedAbsences: Lesson[] = [];

  for (const a of attendances) {
    const type = typeById.get(String(a.Type.Id));
    const standardId = standardIdOf(type);

    if (type?.IsPresenceKind) presentCount += 1;
    if (standardId === ABSENCE || standardId === ABSENCE_JUSTIFIED) absences += 1;
    if (standardId === ABSENCE_JUSTIFIED) absencesJustified += 1;
    if (standardId === LATE) lateArrivals += 1;
    if (standardId === EXEMPTION) exemptions += 1;

    if (standardId === ABSENCE) {
      unexcusedAbsences.push(adaptUnexcused(a));
    }
  }

  const total = attendances.length;
  const monthStats: PresenceMonthStats[] =
    total === 0
      ? []
      : [
          {
            PeriodId: attendances[0]?.Semester ?? 1,
            Month: 0,
            PresencePercentage: Math.round((presentCount / total) * 10000) / 100,
            Absences: absences,
            AbsencesJustified: absencesJustified,
            LateArrivals: lateArrivals,
            LateArrivalsJustified: 0,
            Exemptions: exemptions,
            AbsencesDueToSchool: 0,
          },
        ];

  return { monthStats, subjectStats: [], unexcusedAbsences };
}

function adaptUnexcused(a: LibrusAttendance): Lesson {
  return {
    LessonId: Number(a.Lesson.Id),
    Id: a.Id,
    LessonClassId: 0,
    DayAt: a.Date,
    CalculatePresence: true,
    Replacement: false,
    ModifiedAt: a.AddDate,
    GlobalKey: String(a.Id),
    LessonClassGlobalKey: '',
    TimeSlot: { Id: 0, Start: '', End: '', Display: `Lekcja ${a.LessonNo}`, Position: a.LessonNo },
    TeacherPrimary: EMPTY_EMPLOYEE,
    TeacherMod: EMPTY_EMPLOYEE,
    Clazz: EMPTY_CLAZZ,
  };
}
