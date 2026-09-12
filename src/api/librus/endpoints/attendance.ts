import { librusGet } from '../client';
import type { LibrusAttendance, LibrusAttendanceType } from '../types';

interface AttendancesResponse {
  Attendances: LibrusAttendance[];
}

interface AttendanceTypesResponse {
  Types: LibrusAttendanceType[];
}

export function getLibrusAttendances(accessToken: string): Promise<LibrusAttendance[]> {
  return librusGet<AttendancesResponse>(accessToken, '/Attendances').then((r) => r.Attendances);
}

export function getLibrusAttendanceTypes(accessToken: string): Promise<LibrusAttendanceType[]> {
  return librusGet<AttendanceTypesResponse>(accessToken, '/Attendances/Types').then((r) => r.Types);
}
