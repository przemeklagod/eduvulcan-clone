import type { Employee, Subject } from './common';

export interface Exam {
  Id: number;
  Key: string;
  /** e.g. "Sprawdzian", "Kartkówka" */
  Type: string;
  TypeId: number;
  Content: string;
  CreatedAt: string;
  ModifiedAt: string;
  DeadlineAt: string;
  Creator: Employee;
  Subject: Subject;
  PupilId: number;
}
