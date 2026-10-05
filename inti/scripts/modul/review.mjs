#!/usr/bin/env node
// Memasang cap di akhir review (Pemeriksa): "Direview sampai" = HEAD, "Cap kode" = sidik jari file modul.
// Pemakaian: node scripts/modul/review.mjs <nnn>
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { findModule, isV2, moduleDir, DOK, read, git, proyek, bacaTugas, globModul, codeDigest } from './lib.mjs';

const root = process.env.MODUL_ROOT || process.cwd();
const die = (m) => {
  console.error(m);
  process.exit(1);
};
const m = findModule(root, process.argv[2]);
if (!m || !isV2(root, m)) die('Pemakaian: node scripts/modul/review.mjs <nnn>');
const path = join(moduleDir(root, m), DOK.review);
let text = read(path);
if (!text) die(`Tidak ada ${DOK.review} — buat dari .claude/modul/template/05-review.md`);
if (git(root, ['status', '--porcelain', '--', ...proyek(root).kode]))
  die('Ditolak: ada perubahan kode yang belum di-commit.');
const globs = globModul(bacaTugas(root, m));
if (!globs.length) die('Ditolak: belum ada tugas.');
const { digest, count } = codeDigest(root, globs);
if (!count) die('Ditolak: belum ada file kode milik tugas yang ter-commit.');
const head = git(root, ['rev-parse', 'HEAD']);
const set = (label, value) => {
  const re = new RegExp('^(\\|\\s*' + label + '\\s*\\|)[^|\\n]*(\\|)', 'm');
  if (!re.test(text)) die(`Baris "| ${label} |" tidak ada di header ${DOK.review}.`);
  text = text.replace(re, (_, a, b) => `${a} ${value} ${b}`);
};
set('Direview sampai', '`' + head + '`');
set('Cap kode', '`' + digest + '`');
set('Diperbarui', new Date().toISOString().slice(0, 10));
writeFileSync(path, text);
console.log(`✅ Review ${m} dicap · ${head.slice(0, 7)} · ${count} file`);
