import * as SecureStore from 'expo-secure-store';

// expo-secure-store warns against storing values much larger than ~2KB on iOS
// Keychain. RSA-2048 PEM credentials are close to that boundary, so every value
// is chunked defensively instead of relying on a single setItemAsync call.
const CHUNK_SIZE = 1800;

function chunkKey(key: string, index: number): string {
  return `${key}__${index}`;
}

export async function setSecureJson<T>(key: string, value: T): Promise<void> {
  const serialized = JSON.stringify(value);
  const chunkCount = Math.max(1, Math.ceil(serialized.length / CHUNK_SIZE));

  await SecureStore.setItemAsync(`${key}__count`, String(chunkCount));
  for (let i = 0; i < chunkCount; i++) {
    const chunk = serialized.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    await SecureStore.setItemAsync(chunkKey(key, i), chunk);
  }
}

export async function getSecureJson<T>(key: string): Promise<T | null> {
  const countStr = await SecureStore.getItemAsync(`${key}__count`);
  if (!countStr) return null;

  const count = Number(countStr);
  let serialized = '';
  for (let i = 0; i < count; i++) {
    const chunk = await SecureStore.getItemAsync(chunkKey(key, i));
    if (chunk === null) return null;
    serialized += chunk;
  }

  return JSON.parse(serialized) as T;
}

export async function deleteSecureJson(key: string): Promise<void> {
  const countStr = await SecureStore.getItemAsync(`${key}__count`);
  const count = countStr ? Number(countStr) : 0;
  for (let i = 0; i < count; i++) {
    await SecureStore.deleteItemAsync(chunkKey(key, i));
  }
  await SecureStore.deleteItemAsync(`${key}__count`);
}
