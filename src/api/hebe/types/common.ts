export interface Room {
  Id: number;
  Code: string;
}

export interface Timeslot {
  Id: number;
  Start: string;
  End: string;
  Display: string;
  Position: number;
}

export interface Subject {
  Id: number;
  Key: string;
  Name: string;
  Kod: string;
  Position: number;
}

export interface Employee {
  Id: number;
  Surname: string;
  Name: string;
  DisplayName: string;
}

export interface Clazz {
  Id: number;
  Key: string;
  DisplayName: string;
  Symbol: string;
}

export interface Distribution {
  Id: number;
  Key: string;
  Shortcut: string;
  Name: string;
  PartType: string;
}

export interface PresenceType {
  Id: number;
  Symbol: string;
  Name: string;
  CategoryId: number;
  CategoryName: string;
  Position: number;
  Presence: boolean;
  Absence: boolean;
  LegalAbsence: boolean;
  Late: boolean;
  AbsenceJustified: boolean;
  Removed: boolean;
}

export interface Attachment {
  Name: string;
  Link: string;
}

export interface Address {
  GlobalKey: string;
  Name: string;
  Group?: string;
}
