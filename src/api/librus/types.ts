/** A reference to another Librus resource by id + URL, resolved separately (no inline embedding). */
export interface ApiRef {
  Id: string | number;
  Url: string;
}

export interface LibrusChildAccount {
  id: number;
  login: string;
  studentName: string;
  group: string;
  accessToken: string;
  state: string;
}

export interface SynergiaAccountsResponse {
  lastModification: number;
  accounts: LibrusChildAccount[];
}

export interface LibrusGrade {
  Id: number;
  Lesson: ApiRef;
  Subject: ApiRef;
  Student: ApiRef;
  Category: ApiRef;
  AddedBy: ApiRef;
  Grade: string;
  Date: string;
  AddDate: string;
  Semester: number;
  IsConstituent: boolean;
  IsSemester: boolean;
  IsSemesterProposition: boolean;
  IsFinal: boolean;
  IsFinalProposition: boolean;
}

export interface LibrusSubject {
  Id: number;
  Name: string;
}

export interface LibrusGradeCategory {
  Id: number;
  Name: string;
  Color?: string;
}
