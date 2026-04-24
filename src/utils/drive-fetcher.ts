import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { request } from 'undici';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
}

function extractFolderId(input: string): string {
  const match = input.match(/folders\/([a-zA-Z0-9_-]+)/) ?? input.match(/id=([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? input;
}

async function authHeader(accessToken: string): Promise<Record<string, string>> {
  return { authorization: `Bearer ${accessToken}` };
}

export async function listDriveFolder(folderUrlOrId: string, accessToken: string): Promise<DriveFile[]> {
  const folderId = extractFolderId(folderUrlOrId);
  const url = new URL(`${DRIVE_API}/files`);
  url.searchParams.set('q', `'${folderId}' in parents and trashed = false`);
  url.searchParams.set('fields', 'files(id,name,mimeType,size)');
  url.searchParams.set('pageSize', '200');

  const res = await request(url.toString(), { headers: await authHeader(accessToken) });
  const body = (await res.body.json()) as { files?: DriveFile[]; error?: { message: string } };
  if (res.statusCode >= 400) {
    throw new Error(`Drive list failed: ${body.error?.message ?? res.statusCode}`);
  }
  return body.files ?? [];
}

export async function downloadDriveFile(
  fileId: string,
  accessToken: string,
  destPath: string,
): Promise<void> {
  const url = `${DRIVE_API}/files/${fileId}?alt=media`;
  const res = await request(url, { headers: await authHeader(accessToken) });
  if (res.statusCode >= 400) {
    const body = await res.body.text();
    throw new Error(`Drive download failed ${res.statusCode}: ${body}`);
  }
  const chunks: Buffer[] = [];
  for await (const chunk of res.body) {
    chunks.push(chunk as Buffer);
  }
  await writeFile(destPath, Buffer.concat(chunks));
}

export async function downloadDriveFolder(
  folderUrlOrId: string,
  accessToken: string,
  destDir?: string,
): Promise<{ dir: string; files: DriveFile[] }> {
  const files = await listDriveFolder(folderUrlOrId, accessToken);
  const supported = files.filter((f) =>
    ['image/jpeg', 'image/png', 'video/mp4'].includes(f.mimeType),
  );
  const dir = destDir ?? join(tmpdir(), `adskills-drive-${Date.now()}`);
  await mkdir(dir, { recursive: true });

  for (const file of supported) {
    const ext = file.mimeType === 'image/jpeg' ? '.jpg' : file.mimeType === 'image/png' ? '.png' : '.mp4';
    const safeName = file.name.endsWith(ext) ? file.name : `${file.name}${ext}`;
    await downloadDriveFile(file.id, accessToken, join(dir, safeName));
  }

  return { dir, files: supported };
}
