import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export interface MarkdownReportInput {
  title: string;
  platform: 'meta' | 'google' | 'linkedin' | 'cross';
  skill: string;
  summary: string;
  table?: { headers: string[]; rows: string[][] };
  notes?: string[];
}

export async function writeMarkdownReport(
  input: MarkdownReportInput,
  rootDir: string,
): Promise<string> {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const path = resolve(rootDir, `${input.platform}-ads`, input.skill, `${ts}.md`);
  await mkdir(dirname(path), { recursive: true });

  let md = `# ${input.title}\n\n`;
  md += `_Platform:_ **${input.platform}** · _Skill:_ **${input.skill}** · _Generated:_ ${new Date().toISOString()}\n\n`;
  md += `${input.summary}\n\n`;

  if (input.table) {
    md += `| ${input.table.headers.join(' | ')} |\n`;
    md += `| ${input.table.headers.map(() => '---').join(' | ')} |\n`;
    for (const row of input.table.rows) md += `| ${row.join(' | ')} |\n`;
    md += `\n`;
  }

  if (input.notes?.length) {
    md += `## Notes\n\n`;
    for (const note of input.notes) md += `- ${note}\n`;
  }

  await writeFile(path, md);
  return path;
}
