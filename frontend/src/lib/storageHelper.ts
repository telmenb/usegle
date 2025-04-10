import { browser } from "$app/environment";

export function setItemInStorage(key: string, value: string) {
  if (browser) {
    localStorage.setItem(key, value);
  }
}

export function getItemFromStorage(key: string): string | null {
  if (browser) {
    const item = localStorage.getItem(key);
    return item;
  }
  return null;
}

export function removeItemFromStorage(key: string) {
  if (browser) {
    localStorage.removeItem(key);
  }
}

export function clearStorage() {
  if (browser) {
    localStorage.clear();
  }
}
