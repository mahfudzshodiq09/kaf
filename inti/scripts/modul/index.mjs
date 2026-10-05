#!/usr/bin/env node
// Membangkitkan PLAN/INDEX.md (progres) dan PLAN/KEPUTUSAN.md (keputusan ✅ lintas modul). Jangan diedit manual.
// Pemakaian: node scripts/modul/index.mjs   (alias: pnpm modul:list)
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  listModules,
  isV2,
  moduleDir,
  read,
  DOK,
  parseKeputusan,
  butirModul,
  bacaPersetujuan,
  statusButir,
  bacaTugas,
  tahapModul,
  selHeader,
} from './lib.mjs';

const root = process.env.MODUL_ROOT || process.cwd();
const waktu = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
const baris = [];
const keputusan = [];
for (const m of listModules(root)) {
  if (!isV2(root, m)) {
    baris.push(`| ${m} | – | – | v1 (arsip) | – | – | – | – |`);
    continue;
  }
  const d = moduleDir(root, m);
  const head = read(join(d, DOK.modul));
  const app = selHeader(head, 'App') || '?';
  const ukuran = selHeader(head, 'Ukuran') || '?';
  const butir = butirModul(root, m);
  const p = bacaPersetujuan(root, m);
  const st = [...butir.keys()].map((id) => statusButir(id, butir, p));
  const sah = st.filter((s) => s === 'sah').length;
  const menunggu = st.filter((s) => s === 'belum' || s === 'berubah').length;
  const tunda = st.filter((s) => s === 'tunda').length;
  const tugas = bacaTugas(root, m).filter((t) => t.status !== 'batal');
  const selesai = tugas.filter((t) => t.status === 'selesai').length;
  const blokir = tugas.filter((t) => t.status === 'blokir').length;
  const { tahap, berikut } = tahapModul(root, m);
  baris.push(
    `| ${m} | ${app} | ${ukuran} | ${tahap} | ${sah}/${butir.size}${menunggu ? ` · ${menunggu} menunggu` : ''}${tunda ? ` · ${tunda} ⏳` : ''} | ${tugas.length ? `${selesai}/${tugas.length}` : '–'}${blokir ? ` · ${blokir} ⛔` : ''} | ${existsSync(join(d, DOK.review)) ? '✓' : '–'} | \`${berikut}\` |`,
  );
  for (const r of parseKeputusan(read(join(d, DOK.keputusan))))
    if (statusButir(r.id, butir, p) === 'sah')
      keputusan.push(`| ${m.slice(0, 3)}:${r.id} | ${r.kalau} | ${r.maka} | ${r.sumber} |`);
}
const index = [
  '# Progres Modul',
  '',
  `> Dibangkitkan \`scripts/modul/index.mjs\` · ${waktu}. Jangan diedit manual.`,
  '',
  '| Modul | App | Ukuran | Tahap | Butir sah | Tugas | Review | Berikutnya |',
  '|---|---|---|---|---|---|---|---|',
  ...(baris.length ? baris : ['| – | | | | | | | |']),
  '',
].join('\n');
const kep = [
  '# Keputusan Lintas Modul',
  '',
  `> Semua baris keputusan yang **sudah disetujui**. Dibangkitkan \`scripts/modul/index.mjs\` · ${waktu}. Jangan diedit manual.`,
  '> Agent wajib memeriksa file ini sebelum bertanya (R1). Rujuk dengan `<nnn>:K<n>`.',
  '',
  '| ID | Kalau | Maka | Sumber |',
  '|---|---|---|---|',
  ...(keputusan.length ? keputusan : ['| – | | | |']),
  '',
].join('\n');
writeFileSync(join(root, 'PLAN', 'INDEX.md'), index);
writeFileSync(join(root, 'PLAN', 'KEPUTUSAN.md'), kep);
console.log(index);
