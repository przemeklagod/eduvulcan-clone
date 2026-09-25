import * as Notifications from 'expo-notifications';
import { getGrades } from '../api/hebe/endpoints/grades';
import { getNotes } from '../api/hebe/endpoints/notes';
import { getReceivedMessages } from '../api/hebe/endpoints/messages';
import { getGradesAdapted } from '../api/librus/adapters/grades';
import { getMessagesAdapted } from '../api/librus/adapters/messages';
import { getNotesAdapted } from '../api/librus/adapters/notes';
import { runLibrusApiCall } from '../api/librus/tokenRefresh';
import { getSecureJson, setSecureJson } from '../auth/secureJson';
import { librusChildKey, loadAllLibrusAccounts, loadAllTenants } from '../auth/credentialStore';
import type { StoredLibrusAccount, StoredTenant } from '../auth/credentialStore';
import type { LibrusChildAccount } from '../api/librus/types';

const SEEN_STATE_KEY = 'notif_seen_state';
type Category = 'grades' | 'notes' | 'messages';

interface SeenState {
  [childKey: string]: Partial<Record<Category, string[]>>;
}

function findCurrentPeriodId(periods: Array<{ Id: number; Current: boolean }> | null | undefined): number | undefined {
  return periods?.find((p) => p.Current)?.Id ?? periods?.[0]?.Id;
}

/**
 * Diffs `currentIds` against the previously-seen set for (childKey, category).
 * The first-ever check for a given (childKey, category) only seeds the seen
 * set - it never notifies - so installing the app (or adding a new child)
 * doesn't fire a notification for every pre-existing grade/message/note.
 */
function diffAndMarkSeen(seen: SeenState, childKey: string, category: Category, currentIds: string[]): string[] {
  const previous = seen[childKey]?.[category];
  const isFirstRun = previous === undefined;
  const previousSet = new Set(previous ?? []);

  seen[childKey] = { ...seen[childKey], [category]: currentIds };

  return isFirstRun ? [] : currentIds.filter((id) => !previousSet.has(id));
}

async function notify(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
}

async function checkVulcanTenant(tenant: StoredTenant, seen: SeenState): Promise<void> {
  for (const student of tenant.students) {
    const key = `${tenant.credential.tenant}:${student.Pupil.Id}`;
    const displayName = `${student.Pupil.FirstName} ${student.Pupil.Surname}`;
    const credential = { ...tenant.credential, restUrl: student.Unit.RestURL };
    const periodId = findCurrentPeriodId(student.Periods);

    if (periodId !== undefined) {
      try {
        const grades = await getGrades(credential, { unitId: student.Unit.Id, pupilId: student.Pupil.Id, periodId });
        const newIds = diffAndMarkSeen(seen, key, 'grades', grades.map((g) => String(g.Id)));
        for (const g of grades.filter((g) => newIds.includes(String(g.Id)))) {
          await notify(`Nowa ocena — ${displayName}`, `${g.Column.Subject.Name}: ${g.Content}`);
        }
      } catch (e) {
        console.error(`Background check: grades failed for ${key}`, e);
      }
    }

    try {
      const notes = await getNotes(credential, { pupilId: student.Pupil.Id });
      const newIds = diffAndMarkSeen(seen, key, 'notes', notes.map((n) => String(n.Id)));
      for (const n of notes.filter((n) => newIds.includes(String(n.Id)))) {
        await notify(`${n.Positive ? 'Nowa pochwała' : 'Nowa uwaga'} — ${displayName}`, n.Content.slice(0, 150));
      }
    } catch (e) {
      console.error(`Background check: notes failed for ${key}`, e);
    }

    const box = student.MessageBox?.GlobalKey;
    if (box) {
      try {
        const messages = await getReceivedMessages(credential, { box, pupilId: student.Pupil.Id });
        const newIds = diffAndMarkSeen(seen, key, 'messages', messages.map((m) => m.Id));
        for (const m of messages.filter((m) => newIds.includes(m.Id))) {
          await notify(`Nowa wiadomość — ${displayName}`, `Od: ${m.Sender.Name} — ${m.Subject}`);
        }
      } catch (e) {
        console.error(`Background check: messages failed for ${key}`, e);
      }
    }
  }
}

async function checkLibrusChild(account: StoredLibrusAccount, child: LibrusChildAccount, seen: SeenState): Promise<void> {
  const key = librusChildKey(child.id);
  const displayName = child.studentName;
  const call = <T,>(fn: (accessToken: string) => Promise<T>) => runLibrusApiCall(account.portalEmail, child.id, child.accessToken, fn);

  try {
    const grades = await call(getGradesAdapted);
    const newIds = diffAndMarkSeen(seen, key, 'grades', grades.map((g) => String(g.Id)));
    for (const g of grades.filter((g) => newIds.includes(String(g.Id)))) {
      await notify(`Nowa ocena — ${displayName}`, `${g.Column.Subject.Name}: ${g.Content}`);
    }
  } catch (e) {
    console.error(`Background check: Librus grades failed for ${key}`, e);
  }

  try {
    const notes = await call(getNotesAdapted);
    const newIds = diffAndMarkSeen(seen, key, 'notes', notes.map((n) => String(n.Id)));
    for (const n of notes.filter((n) => newIds.includes(String(n.Id)))) {
      await notify(`${n.Positive ? 'Nowa pochwała' : 'Nowa uwaga'} — ${displayName}`, n.Content.slice(0, 150));
    }
  } catch (e) {
    console.error(`Background check: Librus notes failed for ${key}`, e);
  }

  try {
    const { received } = await call(getMessagesAdapted);
    const newIds = diffAndMarkSeen(seen, key, 'messages', received.map((m) => m.Id));
    for (const m of received.filter((m) => newIds.includes(m.Id))) {
      await notify(`Nowa wiadomość — ${displayName}`, `Od: ${m.Sender.Name} — ${m.Subject}`);
    }
  } catch (e) {
    console.error(`Background check: Librus messages failed for ${key}`, e);
  }
}

/**
 * Checks every registered child (Vulcan and Librus alike, regardless of
 * which one is currently active in the switcher) for new grades, notes, and
 * received messages, firing a local notification per new item. Called both
 * from the best-effort iOS background task and on every app foreground.
 */
export async function checkForUpdates(): Promise<void> {
  const seen = (await getSecureJson<SeenState>(SEEN_STATE_KEY)) ?? {};

  const tenants = await loadAllTenants();
  for (const tenant of tenants) {
    await checkVulcanTenant(tenant, seen);
  }

  const librusAccounts = await loadAllLibrusAccounts();
  for (const account of librusAccounts) {
    for (const child of account.children) {
      await checkLibrusChild(account, child, seen);
    }
  }

  await setSecureJson(SEEN_STATE_KEY, seen);
}
