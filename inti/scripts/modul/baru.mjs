#!/usr/bin/env node
// Membuat folder modul v2 dari template. Pemakaian: node scripts/modul/baru.mjs <slug-kebab-case>
import { mkdirSync, copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { listModules, moduleDir, DOK, proyek } from './lib.mjs';

const root = process.env.MODUL_ROOT || process.cwd();
const slug = process.argv[2];
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug || '')) {
  console.error('Pemakaian: node scripts/modul/baru.mjs <slug-kebab-case>');
  process.exit(1);
}
const nomor =
  Math.max(
    0,
    ...listModules(root)
      .map((m) => Number(m.slice(0, 3)))
      .filter((n) => n < 900),
  ) + 1;
const m = `${String(nomor).padStart(3, '0')}-${slug}`;
const d = moduleDir(root, m);
if (existsSync(d)) {
  console.error(`${d} sudah ada.`);
  process.exit(1);
}
mkdirSync(join(d, 'tugas'), { recursive: true });
const tpl = join(root, '.claude/modul/template');
for (const k of ['modul', 'keputusan']) {
  copyFileSync(join(tpl, DOK[k]), join(d, DOK[k]));
  const f = join(d, DOK[k]);
  writeFileSync(
    f,
    readFileSync(f, 'utf8')
      .replaceAll('<nnn>-<slug>', m)
      .replace('| App | <app> |', `| App | ${proyek(root).app || '-'} |`),
  );
}
console.log(m);
