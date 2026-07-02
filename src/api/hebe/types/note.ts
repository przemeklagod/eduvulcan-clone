import type { Employee } from './common';

export interface NoteCategory {
  Id: number;
  Name: string;
  Type?: string;
  DefaultPoints?: number;
}

/** A "uwaga" (remark) or "pochwała" (praise) - distinguished by `Positive`. */
export interface Note {
  Id: number;
  Key: string;
  IdPupil: number;
  Positive: boolean;
  ValidAt: string;
  ModifiedAt: string;
  Creator: Employee;
  Category?: NoteCategory;
  Content: string;
  Points?: number;
}
