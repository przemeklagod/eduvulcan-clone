import type { Clazz, Distribution, Employee, Room, Subject, Timeslot } from './common';

export interface ScheduleChange {
  Id: number;
  Type: number;
  IsMerge: boolean;
  Separation: boolean;
}

export interface ScheduleSubstitution {
  Id: number;
  UnitId: number;
  ScheduleId: number;
  DateAt: string;
  ChangeDateAt?: string;
  PupilNote?: string;
  Reason?: string;
  Event?: string;
  Room?: Room;
  TimeSlot?: Timeslot;
  Subject?: Subject;
  TeacherPrimary?: Employee;
  TeacherAbsenceReasonId?: number;
  TeacherAbsenceEffectName?: string;
  TeacherSecondary?: Employee;
  TeacherSecondaryAbsenceReasonId?: number;
  TeacherSecondaryAbsenceEffectName?: string;
  TeacherSecondary2?: Employee;
  TeacherSecondary2AbsenceReasonId?: number;
  TeacherSecondary2AbsenceEffectName?: string;
  Change?: ScheduleChange;
  Clazz?: Clazz;
  Distribution?: Distribution;
  ClassAbsence: boolean;
  NoRoom: boolean;
  ModifiedAt: string;
  Description?: string;
}

export interface Schedule {
  Id: number;
  MergeChangeId?: number;
  Event?: string;
  DateAt: string;
  Room?: Room;
  TimeSlot: Timeslot;
  Subject?: Subject;
  TeacherPrimary?: Employee;
  TeacherSecondary?: Employee;
  TeacherSecondary2?: Employee;
  Clazz: Clazz;
  Distribution?: Distribution;
  PupilAlias?: string;
  Substitution?: ScheduleSubstitution;
  Parent?: string;
}

export interface ScheduleExtraSubstitution {
  Id: number;
  ClassAbsence: boolean;
  DateAt?: string;
  JournalId: number;
  LessonDateAt?: string;
  NoRoom: boolean;
  PupilNote?: string;
  Reason?: string;
  Room?: Room;
  ScheduleExtraId: number;
  TeacherAbsenceEffectName?: string;
  TeacherAbsenceReasonId?: number;
  Teacher?: Employee;
  TimeEnd?: string;
  TimeStart?: string;
  UnitId: number;
  ModifiedAt: string;
}

export interface ScheduleExtra {
  Id: number;
  ScheduleExtraId: number;
  UnitId: number;
  Type: number;
  Year: number;
  DateAt: string;
  ExtraDescription: string;
  ScheduleDescription: string;
  SchedulePupilDescription: string;
  Teacher: Employee;
  TimeSlot: Timeslot;
  Room?: Room;
  Substitution?: ScheduleExtraSubstitution;
}
