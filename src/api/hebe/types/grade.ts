import type { Employee, Subject } from './common';

export interface GradeCategory {
  Id: number;
  Name: string;
  Code: string;
}

export interface GradeColumn {
  Id: number;
  Key: string;
  PeriodId: number;
  Name: string;
  Code: string;
  Group: string;
  Number: number;
  Color: number;
  Weight: number;
  Subject: Subject;
  Category?: GradeCategory;
}

export interface Grade {
  Id: number;
  Key: string;
  PupilId: number;
  ContentRaw: string;
  Content: string;
  Comment: string;
  Value?: number;
  Numerator?: number;
  Denominator?: number;
  /** ISO-ish "yyyy-MM-dd HH:mm:ss" string, not a nested date object. */
  CreatedAt: string;
  ModifiedAt: string;
  Creator: Employee;
  Modifier: Employee;
  Column: GradeColumn;
  CorrectedGrade?: string;
}

export interface GradeAverage {
  Id: number;
  PupilId: number;
  PeriodId: number;
  Subject: Subject;
  Average?: string;
  Points?: string;
  Scope: string;
}

export interface GradeSummary {
  Id: number;
  PupilId: number;
  PeriodId: number;
  Subject: Subject;
  Entry_1?: string;
  Entry_2?: string;
  Entry_3?: string;
  ModifiedAt?: string;
}
