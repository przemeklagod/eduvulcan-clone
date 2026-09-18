import { getLibrusUser } from '../endpoints/homework';
import { getLibrusMessages } from '../endpoints/messages';
import type { ApiRef, LibrusMessage, LibrusUser } from '../types';
import type { Message, MessageAddress } from '../../hebe/types/message';

/** Subject/Body arrive as a quoted, escaped JSON string literal (double-encoded) - confirmed live. */
function decodeDoubleEncoded(value: string): string {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** SendDate/ReadDate are unix seconds, unlike every other Librus date field (plain "yyyy-MM-dd" strings) - formatted in local time to match those. */
function formatUnixSeconds(seconds: number): string {
  const d = new Date(seconds * 1000);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export interface LibrusMessagesByFolder {
  received: Message[];
  sent: Message[];
  deleted: Message[];
}

/**
 * Reads api.librus.pl/3.0/Messages directly - an earlier version of this
 * integration used a 4-step wiadomosci.librus.pl cookie-session bridge,
 * believing messages needed a separate, possibly subscription-gated
 * backend. Confirmed live that isn't the case here: the same bearer token
 * already used for Grades/Schedule/etc. reads this endpoint fine, and
 * `getAllTypes=1` covers every folder in one call - richer than the bridge
 * (which was inbox-only) and without the fragile cross-host cookie dance.
 * Sending remains unavailable either way: no write endpoint exists on
 * either backend.
 */
export async function getMessagesAdapted(accessToken: string): Promise<LibrusMessagesByFolder> {
  const messages = await getLibrusMessages(accessToken);

  const userIds = [...new Set(messages.flatMap((m) => [String(m.Sender.Id), ...m.Receiver.map((r) => String(r.Id))]))];
  const users = await Promise.all(userIds.map((id) => getLibrusUser(accessToken, Number(id)).catch(() => null)));
  const userById = new Map<string, LibrusUser>();
  userIds.forEach((id, i) => {
    const user = users[i];
    if (user) userById.set(id, user);
  });

  function addressFor(ref: ApiRef): MessageAddress {
    const user = userById.get(String(ref.Id));
    return { GlobalKey: String(ref.Id), Name: user ? `${user.FirstName} ${user.LastName}` : 'Librus' };
  }

  function adapt(m: LibrusMessage): Message {
    const readDate = m.ReadDates.find((r) => r.ReadDate > 0)?.ReadDate;

    return {
      Id: m.Id,
      GlobalKey: m.Id,
      ThreadKey: m.Id,
      Subject: decodeDoubleEncoded(m.Subject),
      Content: decodeDoubleEncoded(m.Body),
      SentAt: formatUnixSeconds(m.SendDate),
      ReadAt: readDate ? formatUnixSeconds(readDate) : undefined,
      Status: readDate ? 1 : 0,
      Sender: addressFor(m.Sender),
      Receiver: m.Receiver.map(addressFor),
      Attachments: [],
      Withdrawn: false,
    };
  }

  return {
    received: messages.filter((m) => m.inReceived).map(adapt),
    sent: messages.filter((m) => m.inSended).map(adapt),
    deleted: messages.filter((m) => m.inTrash).map(adapt),
  };
}
