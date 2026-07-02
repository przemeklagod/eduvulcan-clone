import { hebeGet, hebePost } from '../client';
import type { HebeCredential } from '../client';
import { fullSyncQuery } from '../pagination';
import type { Message } from '../types/message';

type BoxParams = { box: string; pupilId: number };

export interface SendMessageParams {
  /** The sender's own message box (AccountMessageBox.GlobalKey). */
  boxKey: string;
  /** Existing thread to reply into, or omit to start a new conversation. */
  threadKey?: string;
  subject: string;
  content: string;
  receivers: Array<{ globalKey: string; name: string }>;
}

/**
 * EXPERIMENTAL - not present in any known open-source Hebe client. `mobile/messages`
 * is confirmed to exist as a real route (a deliberately-incomplete probe body got a
 * proper Hebe envelope error, not a 404), but the exact required field shape is a
 * best-effort reconstruction from an analogous (older, differently-pathed) C# client
 * (dolczykk/Vulcanova.Uonet's `mobile/messagebox/message` SendMessageRequest) adapted
 * to match this project's confirmed field-naming conventions (BoxKey/Receiver as used
 * by changeMessageStatus below). Ported blind - not live-tested, to avoid sending a
 * real test message to a real teacher. The first real call IS the live test.
 */
export function sendMessage(credential: HebeCredential, params: SendMessageParams): Promise<void> {
  return hebePost(credential, 'mobile/messages', {
    BoxKey: params.boxKey,
    ...(params.threadKey ? { ThreadKey: params.threadKey } : {}),
    Subject: params.subject,
    Content: params.content,
    Receiver: params.receivers.map((r) => ({ GlobalKey: r.globalKey, Name: r.name })),
  });
}

export function getReceivedMessages(credential: HebeCredential, params: BoxParams): Promise<Message[]> {
  return hebeGet<Message[]>(credential, 'mobile/messages/received/byBox', fullSyncQuery(params));
}

export function getSentMessages(credential: HebeCredential, params: BoxParams): Promise<Message[]> {
  return hebeGet<Message[]>(credential, 'mobile/messages/sent/byBox', fullSyncQuery(params));
}

export function getDeletedMessages(credential: HebeCredential, params: BoxParams): Promise<Message[]> {
  return hebeGet<Message[]>(credential, 'mobile/messages/deleted/byBox', fullSyncQuery(params));
}

export function changeMessageStatus(
  credential: HebeCredential,
  boxKey: string,
  messageKey: string,
  status: number
): Promise<void> {
  return hebePost(credential, 'mobile/messages/status', { BoxKey: boxKey, MessageKey: messageKey, Status: status });
}

export function changeMessageImportance(
  credential: HebeCredential,
  boxKey: string,
  messageKey: string,
  importance: number
): Promise<void> {
  return hebePost(credential, 'mobile/messages/importance', {
    BoxKey: boxKey,
    MessageKey: messageKey,
    Importance: importance,
  });
}
