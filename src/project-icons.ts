import { ICON_BYTES, ICON_MIMES } from './project-icon';

type Entry = { url?: string; bytes: number; nodes: Set<HTMLElement>; id: string; key: string };
export const ICON_CACHE_ENTRIES = 200, ICON_CACHE_BYTES = 16 * 1024 * 1024;

// Failures and evicted bytes stay memoized until the context changes, avoiding render-driven retries.
export class ProjectIcons {
  private entries = new Map<string, Entry>();
  private queue: Entry[] = [];
  private active = 0;
  private bytes = 0;
  private context = '';
  private enabled = false;
  constructor(private request: (path: string) => Promise<any>) {}
  configure(enabled: boolean, origin: string, theme: string) {
    const context = JSON.stringify([origin, theme]);
    if (enabled !== this.enabled || context !== this.context) this.clear();
    this.enabled = enabled; this.context = context;
  }
  clear() {
    for (const entry of this.entries.values()) this.release(entry);
    this.entries.clear(); this.queue.length = 0; this.bytes = 0; this.enabled = false;
  }
  prune() { for (const entry of this.entries.values()) for (const node of entry.nodes) if (!node.isConnected) entry.nodes.delete(node); }
  retain(ids: Set<string>) {
    for (const [key, entry] of this.entries) if (!ids.has(entry.id)) { this.release(entry); this.entries.delete(key); }
    this.queue = this.queue.filter(entry => this.entries.get(entry.key) === entry);
  }
  attach(node: HTMLElement, id: string) {
    if (!this.enabled) return;
    const key = JSON.stringify([this.context, id]); let entry = this.entries.get(key);
    if (!entry) {
      if (this.entries.size >= ICON_CACHE_ENTRIES) return;
      entry = { id, key, bytes: 0, nodes: new Set() }; this.entries.set(key, entry); this.queue.push(entry);
    }
    entry.nodes.add(node); if (entry.url) this.show(entry, node);
    this.drain();
  }
  private show(entry: Entry, node: HTMLElement) {
    if (!node.isConnected || !entry.url) return;
    const image = document.createElement('img'); image.alt = '';
    image.onload = () => { if (node.isConnected && this.entries.get(entry.key) === entry && entry.url === image.src) node.replaceChildren(image); };
    image.onerror = () => { if (image.parentNode === node) node.replaceChildren(node.dataset.initial ?? ''); };
    image.src = entry.url;
  }
  private release(entry: Entry) {
    if (!entry.url) return;
    for (const node of entry.nodes) node.replaceChildren(node.dataset.initial ?? '');
    URL.revokeObjectURL(entry.url); this.bytes -= entry.bytes; entry.url = undefined; entry.bytes = 0;
  }
  private drain() {
    while (this.enabled && this.active < 2 && this.queue.length) {
      const entry = this.queue.shift()!, context = this.context; this.active++;
      const [origin, theme] = JSON.parse(context);
      void this.request('/project-icon?' + new URLSearchParams({ id: entry.id, origin, theme })).then(result => {
        if (!this.enabled || context !== this.context || this.entries.get(entry.key) !== entry || !result || !ICON_MIMES.has(result.mime) || typeof result.data !== 'string' || result.data.length > Math.ceil(ICON_BYTES / 3) * 4) return;
        const raw = atob(result.data); if (!raw.length || raw.length > ICON_BYTES) return;
        const blob = new Blob([Uint8Array.from(raw, c => c.charCodeAt(0))], { type: result.mime });
        for (const cached of this.entries.values()) { if (this.bytes + blob.size <= ICON_CACHE_BYTES) break; this.release(cached); }
        entry.bytes = blob.size; entry.url = URL.createObjectURL(blob); this.bytes += blob.size;
        for (const node of entry.nodes) this.show(entry, node);
      }).catch(() => {}).finally(() => { this.active--; this.drain(); });
    }
  }
}
