import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'ai-graffiti-device-id';

export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
