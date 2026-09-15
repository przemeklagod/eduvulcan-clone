import { getLibrusAttendances, getLibrusAttendanceTypes, getLibrusLesson } from '../endpoints/attendance';
import { getLibrusSubjects } from '../endpoints/grades';
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

interface SubjectAggregate {
  name: string;
  total: number;
  present: number;
  absences: number;
  absencesJustified: number;
  lateArrivals: number;
  exemptions: number;
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
 * only ever reads the last monthStats entry as "overall").
 *
 * Per-subject stats need an Attendance.Lesson.Id -> Subject lookup, which
 * Attendances themselves don't carry. An earlier version tried to build this
 * from a week's /Timetables (which does have inline Subject names), but that
 * only resolved ~20% of lesson ids live - the weekly timetable view doesn't
 * reliably list every lesson occurrence. /Lessons/{id} resolves any lesson
 * directly and matched 100% in testing, so this fetches one per distinct
 * Lesson.Id referenced by the attendance list instead (grows with the
 * number of distinct lessons over the year, not with attendance count).
 */
export async function getAttendanceAdapted(accessToken: string): Promise<LibrusAttendanceAdapted> {
  const [attendances, types] = await Promise.all([getLibrusAttendances(accessToken), getLibrusAttendanceTypes(accessToken)]);
  const typeById = new Map(types.map((t) => [String(t.Id), t]));

  const uniqueLessonIds = [...new Set(attendances.map((a) => String(a.Lesson.Id)))];
  const [lessons, subjects] = await Promise.all([
    Promise.all(uniqueLessonIds.map((id) => getLibrusLesson(accessToken, id).catch(() => null))),
    getLibrusSubjects(accessToken),
  ]);
  const subjectNameById = new Map(subjects.map((s) => [String(s.Id), s.Name]));

  const subjectByLessonId = new Map<string, { Id: number; Name: string }>();
  uniqueLessonIds.forEach((lessonId, i) => {
    const lesson = lessons[i];
    if (!lesson) return;
    const subjectId = String(lesson.Subject.Id);
    subjectByLessonId.set(lessonId, { Id: Number(subjectId), Name: subjectNameById.get(subjectId) ?? 'Przedmiot' });
  });

  let presentCount = 0;
  let absences = 0;
  let absencesJustified = 0;
  let lateArrivals = 0;
  let exemptions = 0;
  const unexcusedAbsences: Lesson[] = [];
  const bySubject = new Map<number, SubjectAggregate>();

  for (const a of attendances) {
    const type = typeById.get(String(a.Type.Id));
    const standardId = standardIdOf(type);
    const isPresent = Boolean(type?.IsPresenceKind);

    if (isPresent) presentCount += 1;
    if (standardId === ABSENCE || standardId === ABSENCE_JUSTIFIED) absences += 1;
    if (standardId === ABSENCE_JUSTIFIED) absencesJustified += 1;
    if (standardId === LATE) lateArrivals += 1;
    if (standardId === EXEMPTION) exemptions += 1;
    if (standardId === ABSENCE) unexcusedAbsences.push(adaptUnexcused(a));

    const subject = subjectByLessonId.get(String(a.Lesson.Id));
    if (subject) {
      const agg = bySubject.get(subject.Id) ?? {
        name: subject.Name,
        total: 0,
        present: 0,
        absences: 0,
        absencesJustified: 0,
        lateArrivals: 0,
        exemptions: 0,
      };
      agg.total += 1;
      if (isPresent) agg.present += 1;
      if (standardId === ABSENCE || standardId === ABSENCE_JUSTIFIED) agg.absences += 1;
      if (standardId === ABSENCE_JUSTIFIED) agg.absencesJustified += 1;
      if (standardId === LATE) agg.lateArrivals += 1;
      if (standardId === EXEMPTION) agg.exemptions += 1;
      bySubject.set(subject.Id, agg);
    }
  }

  const total = attendances.length;
  const periodId = attendances[0]?.Semester ?? 1;

  const monthStats: PresenceMonthStats[] =
    total === 0
      ? []
      : [
          {
            PeriodId: periodId,
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

  const subjectStats: PresenceSubjectStats[] = [...bySubject.entries()]
    .map(([subjectId, agg]) => ({
      PeriodId: periodId,
      SubjectId: subjectId,
      SubjectName: agg.name,
      PresencePercentage: agg.total ? Math.round((agg.present / agg.total) * 10000) / 100 : 0,
      Absences: agg.absences,
      AbsencesJustified: agg.absencesJustified,
      LateArrivals: agg.lateArrivals,
      LateArrivalsJustified: 0,
      Exemptions: agg.exemptions,
      AbsencesDueToSchool: 0,
    }))
    .sort((a, b) => a.SubjectName.localeCompare(b.SubjectName));

  return { monthStats, subjectStats, unexcusedAbsences };
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
