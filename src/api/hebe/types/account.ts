import type { Address } from './common';

export interface AccountLinks {
  Root: string;
  Group: string;
  Symbol: string;
  Alias?: string;
  QuestionnaireRoot: string;
  ExResourcesUrl: string;
}

export interface SchoolUnit {
  Id: number;
  Symbol: string;
  Short: string;
  RestURL: string;
  Name: string;
  Address?: string;
  Patron?: string;
  DisplayName: string;
  SchoolTopic: string;
}

export interface ConstituentUnit {
  Id: number;
  Short: string;
  Name: string;
  Address?: string;
  Patron?: string;
  SchoolTopic: string;
}

export interface Pupil {
  Id: number;
  LoginId: number;
  FirstName: string;
  SecondName: string;
  Surname: string;
  Sex: boolean;
}

export interface Period {
  Capabilities: string[];
  Id: number;
  Level: number;
  Number: number;
  StartAt: string;
  EndAt: string;
  Current: boolean;
  Last: boolean;
}

export interface Journal {
  Id: number;
  StartAt: string;
  EndAt: string;
  PupilNumber: number;
}

export interface Constraints {
  AbsenceDaysBefore: number;
  AbsenceHoursBefore: string;
}

export interface AccountMessageBox {
  Id: number;
  GlobalKey: string;
  Name: string;
}

/** The eduVulcan "student/pupil account" record - one per (login, tenant, child). */
export interface Account {
  TopLevelPartition: string;
  Partition: string;
  Links: AccountLinks;
  ClassDisplay?: string;
  InfoDisplay?: string;
  Unit: SchoolUnit;
  ConstituentUnit: ConstituentUnit;
  Capabilities: string[];
  EducatorsList: Address[];
  Pupil: Pupil;
  CaretakerId?: number;
  Periods: Period[];
  Journal?: Journal;
  Constraints: Constraints;
  State: number;
  MessageBox?: AccountMessageBox;
  ProfileId?: string;
}
