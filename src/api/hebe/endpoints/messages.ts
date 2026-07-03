import { hebeGet, hebePost } from '../client';
import type { HebeCredential } from '../client';
import { fullSyncQuery } from '../pagination';
import type { Message } from '../types/message';

type BoxParams = { box: string; pupilId: number };

export interface SendMessageParams {
  /** The sender's own message box (AccountMessageBox.GlobalKey). */
  boxKey: string;
  /** The sender's own display name as it appears in others' addressbooks (AccountMessageBox.Name). */
  senderName: string;
  /** Existing thread to reply into, or omit to start a new conversation. */
  threadKey?: string;
  subject: string;
  content: string;
  receivers: Array<{ globalKey: string; name: string }>;
}

/**
 * Confirmed working live (sent message appeared in the official eduVulcan app's
 * "Wysłane" folder). Not present in any known open-source Hebe client - this shape
 * was reconstructed from an analogous (older, differently-pathed) C# client
 * (dolczykk/Vulcanova.Uonet's `mobile/messagebox/message` SendMessageRequest),
 * adapted to this project's confirmed field-naming conventions. The key finding:
 * `Sender` (a `{GlobalKey, Name}` MessageAddress, same shape the read endpoints
 * return) is required - omitting it crashes the endpoint with a generic 500
 * "NullReferenceException".
 */
export function sendMessage(credential: HebeCredential, params: SendMessageParams): Promise<void> {
  return hebePost(credential, 'mobile/messages', {
    BoxKey: params.boxKey,
    ...(params.threadKey ? { ThreadKey: params.threadKey } : {}),
    Subject: params.subject,
    Content: params.content,
    Sender: { GlobalKey: params.boxKey, Name: params.senderName },
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
