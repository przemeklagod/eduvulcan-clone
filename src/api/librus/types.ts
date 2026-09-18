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
  Short?: string;
  IsExtracurricular?: boolean;
}

export interface LibrusHomeworkCategory {
  Id: number;
  Name: string;
}

export interface LibrusGradeCategory {
  Id: number;
  Name: string;
  Color?: string;
}

/**
 * Unlike Grades/Attendances, Timetable lesson entries come back already
 * partially expanded (Subject/Teacher carry inline names, not just an
 * ApiRef) - confirmed live, so no separate lookup is needed to render a
 * schedule.
 */
export interface LibrusTimetableLesson {
  Lesson: ApiRef;
  TimetableEntry: ApiRef;
  DateFrom: string;
  DateTo: string;
  LessonNo: string;
  DayNo: string;
  Subject?: { Id: number; Name: string; Short: string; Url: string };
  Teacher?: { Id: number; FirstName: string; LastName: string; Url: string };
  IsSubstitutionClass: boolean;
  IsCanceled: boolean;
  SubstitutionNote: string | null;
  HourFrom: string;
  HourTo: string;
  VirtualClass?: ApiRef;
  VirtualClassName?: string;
}

/** Keyed by date ("YYYY-MM-DD"); each day is an array of lesson slots, each slot an array of lessons (usually one, more when merged/substituted). */
export interface LibrusTimetableResponse {
  Timetable: Record<string, LibrusTimetableLesson[][]>;
}

export interface LibrusAttendance {
  Id: number;
  Lesson: ApiRef;
  Student: ApiRef;
  Date: string;
  AddDate: string;
  LessonNo: number;
  Semester: number;
  Type: ApiRef;
  AddedBy: ApiRef;
}

/**
 * The 5 standard type ids are stable across accounts (confirmed live):
 * 1 Nieobecność, 2 Spóźnienie, 3 Nieobecność usprawiedliwiona, 4 Zwolnienie,
 * 100 Obecność. Custom types (e.g. "zdalne") carry a StandardType ref back
 * to one of these five.
 */
export interface LibrusAttendanceType {
  Id: number;
  Name: string;
  Short: string;
  Standard: boolean;
  IsPresenceKind: boolean;
  Order: number;
  StandardType?: ApiRef;
}

export interface LibrusHomework {
  Id: number;
  Content: string;
  Date: string;
  AddDate: string;
  Category: ApiRef;
  Subject: ApiRef;
  CreatedBy: ApiRef;
  Classroom?: { Id: number; Symbol: string; Name: string; Size: number };
}

export interface LibrusUser {
  Id: number;
  FirstName: string;
  LastName: string;
}

/** A resolved lesson occurrence - unlike Timetable entries (which only cover the current/a given week), this resolves any Lesson.Id directly, which is what Attendances/Grades reference. */
export interface LibrusLesson {
  Id: number;
  Teacher: ApiRef;
  Subject: ApiRef;
  Class: ApiRef;
}

/**
 * Field names confirmed from WebMasterPL/librus-PP (a sibling personal
 * unofficial Librus iOS client, same category as this project - real,
 * production-tested `RawNote` decoder), not this project's own live testing:
 * this account had zero notes recorded to verify against directly.
 * `Positive` is a 3-way value (0 negatywna, 1 pozytywna, 2 neutralna), unlike
 * Vulcan's plain boolean - see the adapter for how that's collapsed.
 */
export interface LibrusNote {
  Id: number;
  Text: string;
  Category?: ApiRef;
  Teacher?: ApiRef;
  Date: string;
  Positive: number;
}

export interface LibrusNoteCategory {
  Id: number;
  CategoryName: string;
}

/** Confirmed live - `Subject` here means the notice's title/topic, not a school subject. */
export interface LibrusAnnouncement {
  Id: string;
  StartDate: string;
  EndDate: string;
  Subject: string;
  Content: string;
  AddedBy?: ApiRef;
  CreationDate: string;
  WasRead: boolean;
}

/** wiadomosci.librus.pl list item - `content` is base64, truncated to a preview (full text needs the detail call). */
export interface LibrusWiadomosciListItem {
  messageId: string;
  senderName: string;
  topic: string;
  content: string;
  sendDate: string;
  readDate: string | null;
  isAnyFileAttached: boolean;
}

/** wiadomosci.librus.pl message detail - `Message` (capital M) is the full base64 body, unlike the list's truncated `content`. */
export interface LibrusWiadomosciDetail {
  messageId: string;
  senderId: string;
  senderName: string;
  topic: string;
  Message: string;
  sendDate: string;
  readDate: string | null;
}
