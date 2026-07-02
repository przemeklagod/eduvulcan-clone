import type { PresenceType, Timeslot } from './common';

export interface PresenceExtra {
  Id: number;
  PresenceType?: PresenceType;
  DayAt: string;
  TimeSlot: Timeslot;
  IdWeakRef?: number;
  Type: number;
}

export interface PresenceMonthStats {
  PeriodId: number;
  Month: number;
  PresencePercentage: number;
  Absences: number;
  AbsencesJustified: number;
  LateArrivals: number;
  LateArrivalsJustified: number;
  Exemptions: number;
  AbsencesDueToSchool: number;
}

export interface PresenceSubjectStats {
  PeriodId: number;
  SubjectId: number;
  SubjectName: string;
  PresencePercentage: number;
  Absences: number;
  AbsencesJustified: number;
  LateArrivals: number;
  LateArrivalsJustified: number;
  Exemptions: number;
  AbsencesDueToSchool: number;
}
