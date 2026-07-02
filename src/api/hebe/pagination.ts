export const FULL_SYNC_SENTINEL = '1970-01-01T01:00:00';
export const DEFAULT_PAGE_SIZE = 500;

export function fullSyncQuery<T extends object>(params: T) {
  return { lastId: 0, lastSyncDate: FULL_SYNC_SENTINEL, pageSize: DEFAULT_PAGE_SIZE, ...params };
}
