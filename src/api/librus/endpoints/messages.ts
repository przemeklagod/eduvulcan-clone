import { librusGet } from '../client';
import type { LibrusMessage } from '../types';

interface MessagesResponse {
  Messages: LibrusMessage[];
}

/** `getAllTypes=1` returns received+sent+trash+spam in one call - see LibrusMessage's `in*` flags. `alternativeBody=1` inlines the full HTML body, no per-message detail fetch needed. */
export function getLibrusMessages(accessToken: string): Promise<LibrusMessage[]> {
  return librusGet<MessagesResponse>(accessToken, '/Messages?getAllTypes=1&alternativeBody=1&limit=300').then((r) => r.Messages);
}
