const STORAGE_PREFIX = 'data_label_pro_'

export const loadFromStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export const saveToStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export const clearStorage = (): void => {
  if (typeof window === 'undefined') return
  Object.keys(window.localStorage)
    .filter((k) => k.startsWith(STORAGE_PREFIX))
    .forEach((k) => window.localStorage.removeItem(k))
}
