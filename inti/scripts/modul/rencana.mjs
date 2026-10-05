#!/usr/bin/env node
// Rencana kerja /modul build & review: tugas dalam rentang, urut nomor, dengan langkah berikutnya per tugas.
// Pemakaian: node scripts/modul/rencana.mjs <nnn> [3 | 1-10 | 1,3,5-7]
import { findModule, isV2, bacaTugas, cekTugas, parseRentang } from './lib.mjs';

const root = process.env.MODUL_ROOT || process.cwd();
const [ref, rentangTeks] = process.argv.slice(2);
const m = findModule(root, ref);
if (!m || !isV2(root, m)) {
  console.error('Pemakaian: node scripts/modul/rencana.mjs <nnn> [3 | 1-10 | 1,3,5-7]');
  process.exit(1);
}
let rentang;
try {
  rentang = parseRentang(rentangTeks);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
const semua = bacaTugas(root, m);
const pilih = semua.filter((t) => !rentang || rentang.includes(t.no));
const hilang = (rentang || []).filter((no) => !semua.some((t) => t.no === no));
const LANGKAH = {
  rancang: 'tes→build',
  tes: 'tes→build',
  siap: 'build',
  kerja: 'build',
  perbaikan: 'perbaikan',
  blokir: 'blokir',
  selesai: '–',
  batal: '–',
};
console.log(`${m} · rentang ${rentangTeks || 'semua'}${hilang.length ? ` · tidak ada: #${hilang.join(', #')}` : ''}`);
console.log('| No | Status | Langkah | Catatan |');
console.log('|---|---|---|---|');
for (const t of pilih) {
  const catatan = [];
  const c = cekTugas(root, m, t);
  if (!c.ok && !['selesai', 'batal'].includes(t.status)) catatan.push(`belum sah: ${c.alasan.join('; ')}`);
  const tunggu = t.bergantung.filter((b) => semua.find((x) => x.no === b)?.status !== 'selesai');
  if (tunggu.length && !['selesai', 'batal'].includes(t.status)) catatan.push(`menunggu #${tunggu.join(', #')}`);
  console.log(`| ${t.no} | ${t.status} | ${LANGKAH[t.status] || '?'} | ${catatan.join(' · ') || '–'} |`);
}
