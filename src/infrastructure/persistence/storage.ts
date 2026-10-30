const PREFIX = 'kurio.'

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const value = localStorage.getItem(`${PREFIX}${key}`)
      return value ? (JSON.parse(value) as T) : fallback
    } catch (error) {
      console.error(`Não foi possível ler ${key} do armazenamento local.`, error)
      return fallback
    }
  },
  set<T>(key: string, value: T): void {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value))
  },
  remove(key: string): void {
    localStorage.removeItem(`${PREFIX}${key}`)
  },
}
