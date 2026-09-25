import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { checkForUpdates } from './checkForUpdates';

const BACKGROUND_TASK_NAME = 'eduvulcan-check-for-updates';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Must be defined at module scope (not inside a component) - this is what
// actually runs when iOS wakes the app in the background.
TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    await checkForUpdates();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (e) {
    console.error('Background check task failed', e);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function requestNotificationPermissions(): Promise<void> {
  await Notifications.requestPermissionsAsync();
}

/**
 * iOS treats `minimumInterval` as an inexact minimum, not a schedule - the
 * actual check cadence depends on usage patterns, battery, and network, and
 * can be far less frequent than requested (sometimes only once overnight).
 * The `checkForUpdates()` call on every app foreground (see app/_layout.tsx)
 * is what makes this reliable in practice; this background task is a
 * best-effort bonus for while the app isn't open.
 */
export async function registerBackgroundCheckTask(): Promise<void> {
  const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
  if (alreadyRegistered) return;
  await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_NAME, { minimumInterval: 15 });
}
