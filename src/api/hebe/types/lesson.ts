import type { Clazz, Distribution, Employee, PresenceType, Subject, Timeslot } from './common';

export interface Lesson {
  LessonId: number;
  PresenceType?: PresenceType;
  JustificationStatus?: number;
  Id: number;
  LessonClassId: number;
  DayAt: string;
  CalculatePresence: boolean;
  GroupDefinition?: string;
  PublicResources?: string;
  RemoteResources?: string;
  Replacement: boolean;
  ModifiedAt: string;
  GlobalKey: string;
  Note?: string;
  Topic?: string;
  LessonNumber?: number;
  LessonClassGlobalKey: string;
  TimeSlot: Timeslot;
  Subject?: Subject;
  TeacherPrimary: Employee;
  TeacherSecondary?: Employee;
  TeacherMod: Employee;
  Clazz: Clazz;
  Distribution?: Distribution;
}
