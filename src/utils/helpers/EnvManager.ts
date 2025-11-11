export class EnvManager {
    private readonly isBrowser = typeof window !== "undefined";

    get(name: string): string | undefined {
        if (this.isBrowser) return (import.meta as any)?.env?.[name];
        return process?.env?.[name];
    }

    require(name: string): string {
        const value = this.get(name);
        if (!value) throw new Error(`Missing environment variable: ${name}`);
        return value;
    }

    isProd() {
        const mode = this.get("NODE_ENV") || this.get("MODE");
        return mode === "production";
    }
}
