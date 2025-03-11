import { browser } from "$app/environment";

export function setItemInStorage(key: string, value: any) {
  if (browser) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export function getItemFromStorage(key: string): string | null {
  if (browser) {
    const item = localStorage.getItem(key);
    return item ?? null;
  }
  return null;
}

export function clearStorage() {
  if (browser) {
    localStorage.clear();
  }
}
