import type { Attachment } from './common';

export interface MessageAddressExtras {
  DisplayedClass: string;
}

export interface MessageAddress {
  GlobalKey: string;
  Name: string;
  HasRead?: boolean;
  Extras?: MessageAddressExtras;
}

export interface Message {
  Id: string;
  GlobalKey: string;
  ThreadKey: string;
  Subject: string;
  Content: string;
  SentAt: string;
  ReadAt?: string;
  Status: number;
  Sender: MessageAddress;
  Receiver: MessageAddress[];
  Attachments: Attachment[];
  Withdrawn: boolean;
}
