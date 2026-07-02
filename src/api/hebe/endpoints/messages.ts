import { hebeGet, hebePost } from '../client';
import type { HebeCredential } from '../client';
import { fullSyncQuery } from '../pagination';
import type { Message } from '../types/message';

type BoxParams = { box: string; pupilId: number };

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
