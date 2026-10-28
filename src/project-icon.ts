export const ICON_BYTES = 5 * 1024 * 1024;
export const ICON_MIMES = new Set(['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon']);
export function localOrigin(origin: string) {
  try { const url = new URL(origin); return ['http:', 'https:'].includes(url.protocol) && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) && !url.username && !url.password && url.origin === origin; }
  catch { return false; }
}

export async function readProjectIcon(origin: string, id: string, theme: string, fetcher: typeof fetch = fetch) {
  if (!localOrigin(origin) || !['light', 'dark'].includes(theme) || id === '.' || id === '..') return null;
  try {
    const response = await fetcher(`${origin}/api/projects/${encodeURIComponent(id)}/icon?theme=${theme}`, { redirect: 'error', signal: AbortSignal.timeout(2500), credentials: 'omit' });
    const mime = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    if (!response.ok || !mime || !ICON_MIMES.has(mime) || Number(response.headers.get('content-length')) > ICON_BYTES || !response.body) { await response.body?.cancel(); return null; }
    const reader = response.body.getReader(), chunks: Uint8Array[] = []; let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > ICON_BYTES) { await reader.cancel(); return null; }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    return size ? { mime, data: Buffer.concat(chunks).toString('base64') } : null;
  } catch { return null; }
}
