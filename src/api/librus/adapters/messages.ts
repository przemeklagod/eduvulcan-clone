import { establishWiadomosciSession, getInboxMessageDetail, getInboxMessages } from '../wiadomosci';
import type { LibrusWiadomosciDetail } from '../types';
import type { Message } from '../../hebe/types/message';

function decodeBase64(value: string): string {
  return Buffer.from(value, 'base64').toString('utf8');
}

function adaptMessage(detail: LibrusWiadomosciDetail): Message {
  return {
    Id: detail.messageId,
    GlobalKey: detail.messageId,
    ThreadKey: detail.messageId,
    Subject: detail.topic,
    Content: decodeBase64(detail.Message),
    SentAt: detail.sendDate,
    ReadAt: detail.readDate ?? undefined,
    Status: detail.readDate ? 1 : 0,
    Sender: { GlobalKey: detail.senderId, Name: detail.senderName },
    Receiver: [],
    Attachments: [],
    Withdrawn: false,
  };
}

/**
 * Librus messages ("wiadomości") don't live on the same api.librus.pl/3.0
 * backend as Grades/Schedule/Attendance/HomeWorks - they need the separate
 * wiadomosci.librus.pl cookie-session bridge (see ../wiadomosci.ts). Inbox
 * only: Librus has no sent/deleted folder API, and sending isn't
 * implemented (a separate phase, like Vulcan's justify-absence).
 * The list endpoint truncates each message's body to a preview, so the full
 * text is fetched per-message via the detail endpoint.
 */
export async function getInboxMessagesAdapted(accessToken: string): Promise<Message[]> {
  await establishWiadomosciSession(accessToken);
  const list = await getInboxMessages();
  const details = await Promise.all(list.map((m) => getInboxMessageDetail(m.messageId)));
  return details.map(adaptMessage).sort((a, b) => b.SentAt.localeCompare(a.SentAt));
}
