export class Profiler {
    private stack: { label: string; start: number }[] = [];
    private results: Record<string, number> = {};

    start(label: string) {
        this.stack.push({ label, start: performance.now() });
    }

    end(label: string) {
        const entry = this.stack.findLast((e) => e.label === label);
        if (!entry) return;
        const duration = performance.now() - entry.start;
        this.results[label] = duration;
    }

    summary() {
        return this.results;
    }
}
