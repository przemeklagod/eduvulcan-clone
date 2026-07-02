import type { Attachment, Employee, Subject } from './common';

export interface Homework {
  Id: number;
  Key: string;
  IdPupil: number;
  IdHomework: number;
  Content: string;
  IsAnswerRequired: boolean;
  CreatedAt: string;
  ModifiedAt: string;
  DateAt: string;
  AnswerAt?: string;
  DeadlineAt: string;
  Creator: Employee;
  Subject: Subject;
  Attachments: Attachment[];
}
