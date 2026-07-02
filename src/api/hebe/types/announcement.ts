import type { Attachment, Employee } from './common';

export interface Announcement {
  Id: number;
  IdUnit: number;
  Title: string;
  Content: string;
  Category?: string;
  From: string;
  To: string;
  Sender: Employee;
  Attachments: Attachment[];
  CreatedAt: string;
  ModifiedAt: string;
}
