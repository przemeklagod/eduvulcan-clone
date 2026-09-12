import { librusGet } from '../client';
import type { LibrusTimetableResponse } from '../types';

export function getLibrusTimetable(accessToken: string, weekStart: string): Promise<LibrusTimetableResponse> {
  return librusGet<LibrusTimetableResponse>(accessToken, `/Timetables?weekStart=${weekStart}`);
}
