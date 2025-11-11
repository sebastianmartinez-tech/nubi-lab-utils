export class StorageManager {
    constructor(private storage: Storage = localStorage) {}

    set<T>(key: string, value: T, ttlMs?: number) {
        const data = { value, expires: ttlMs ? Date.now() + ttlMs : null };
        this.storage.setItem(key, JSON.stringify(data));
    }

    get<T>(key: string): T | null {
        const raw = this.storage.getItem(key);
        if (!raw) return null;
        try {
            const data = JSON.parse(raw);
            if (data.expires && Date.now() > data.expires) {
                this.storage.removeItem(key);
                return null;
            }
            return data.value as T;
        } catch {
            return null;
        }
    }

    remove(key: string) {
        this.storage.removeItem(key);
    }

    clear() {
        this.storage.clear();
    }
}
