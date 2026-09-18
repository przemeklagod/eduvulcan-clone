import { getLibrusAnnouncements } from '../endpoints/announcements';
import { getLibrusUser } from '../endpoints/homework';
import type { LibrusUser } from '../types';
import type { Announcement } from '../../hebe/types/announcement';

const EMPTY_EMPLOYEE = { Id: 0, Surname: '', Name: '', DisplayName: '' };

/** SchoolNotice.Id is a "LID-NBOARD-NOTICE-..." string, unlike Vulcan's numeric Announcement.Id - hashed into a stable number since nothing here needs it to round-trip back to Librus. */
function hashToNumber(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export async function getAnnouncementsAdapted(accessToken: string): Promise<Announcement[]> {
  const notices = await getLibrusAnnouncements(accessToken);

  const senderIds = [...new Set(notices.map((n) => n.AddedBy?.Id).filter((id): id is number | string => id !== undefined).map(String))];
  const senders = await Promise.all(senderIds.map((id) => getLibrusUser(accessToken, Number(id)).catch(() => null)));
  const senderById = new Map<string, LibrusUser>();
  senderIds.forEach((id, i) => {
    const sender = senders[i];
    if (sender) senderById.set(id, sender);
  });

  return notices.map((n): Announcement => {
    const sender = n.AddedBy ? senderById.get(String(n.AddedBy.Id)) : undefined;

    return {
      Id: hashToNumber(n.Id),
      IdUnit: 0,
      Title: n.Subject,
      Content: n.Content,
      From: n.StartDate,
      To: n.EndDate,
      Sender: sender
        ? { Id: sender.Id, Surname: sender.LastName, Name: sender.FirstName, DisplayName: `${sender.FirstName} ${sender.LastName}` }
        : EMPTY_EMPLOYEE,
      Attachments: [],
      CreatedAt: n.CreationDate,
      ModifiedAt: n.CreationDate,
    };
  });
}
