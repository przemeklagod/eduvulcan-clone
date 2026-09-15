import { librusGet } from '../client';
import type { LibrusAttendance, LibrusAttendanceType, LibrusLesson } from '../types';

interface AttendancesResponse {
  Attendances: LibrusAttendance[];
}

interface AttendanceTypesResponse {
  Types: LibrusAttendanceType[];
}

interface LessonResponse {
  Lesson: LibrusLesson;
}

export function getLibrusAttendances(accessToken: string): Promise<LibrusAttendance[]> {
  return librusGet<AttendancesResponse>(accessToken, '/Attendances').then((r) => r.Attendances);
}

export function getLibrusAttendanceTypes(accessToken: string): Promise<LibrusAttendanceType[]> {
  return librusGet<AttendanceTypesResponse>(accessToken, '/Attendances/Types').then((r) => r.Types);
}

export function getLibrusLesson(accessToken: string, lessonId: string): Promise<LibrusLesson> {
  return librusGet<LessonResponse>(accessToken, `/Lessons/${lessonId}`).then((r) => r.Lesson);
}
