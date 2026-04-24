import { readdir, stat } from 'node:fs/promises';
import { extname, join, basename } from 'node:path';

const SUPPORTED: Record<string, 'image/jpeg' | 'image/png' | 'video/mp4'> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
};

export interface ScannedAsset {
  path: string;
  name: string;
  sizeBytes: number;
  mimeType: 'image/jpeg' | 'image/png' | 'video/mp4';
}

export async function scanCreativeFolder(folder: string): Promise<ScannedAsset[]> {
  const entries = await readdir(folder);
  const out: ScannedAsset[] = [];
  for (const entry of entries) {
    const ext = extname(entry).toLowerCase();
    const mime = SUPPORTED[ext];
    if (!mime) continue;
    const full = join(folder, entry);
    const st = await stat(full);
    if (!st.isFile()) continue;
    out.push({
      path: full,
      name: basename(entry, ext),
      sizeBytes: st.size,
      mimeType: mime,
    });
  }
  out.sort((a, b) => a.path.localeCompare(b.path));
  return out;
}
