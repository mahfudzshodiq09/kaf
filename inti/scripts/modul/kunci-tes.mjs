#!/usr/bin/env node
// Mengunci test satu tugas setelah Perancang Uji selesai (status tes → siap), atau membukanya lagi (--buka).
// Pemakaian: node scripts/modul/kunci-tes.mjs <nnn> <no> [--buka "alasan"]
import { join } from 'node:path';
import { appendFileSync, readFileSync, existsSync } from 'node:fs';
import {
  findModule,
  isV2,
  bacaTugas,
  bagian,
  bacaKunci,
  kunciPath,
  tulisJson,
  hashFile,
  setStatusTugas,
  cekTugas,
  tugasAktif,
} from './lib.mjs';

const root = process.env.MODUL_ROOT || process.cwd();
const [ref, noStr, flag, ...alasanArr] = process.argv.slice(2);
const die = (msg) => {
  console.error(msg);
  process.exit(1);
};
const m = findModule(root, ref);
if (!m || !isV2(root, m) || !/^\d+$/.test(noStr || ''))
  die('Pemakaian: node scripts/modul/kunci-tes.mjs <nnn> <no> [--buka "alasan"]');
const t = bacaTugas(root, m).find((x) => x.no === Number(noStr));
if (!t) die(`Tugas ${noStr} tidak ada di ${m}.`);
const kunci = bacaKunci(root, m);

if (flag === '--buka') {
  const alasan = alasanArr.join(' ').trim();
  if (!alasan) die('--buka wajib disertai alasan.');
  const lain = tugasAktif(bacaTugas(root, m)).filter((x) => x.no !== t.no);
  if (lain.length) die(`Tidak bisa membuka: tugas #${lain.map((x) => x.no).join(', #')} sedang aktif.`);
  delete kunci[t.no];
  tulisJson(kunciPath(root, m), kunci);
  setStatusTugas(t.path, 'tes');
  appendFileSync(t.path, `\n> 🔓 Test dibuka lagi ${new Date().toISOString().slice(0, 10)}: ${alasan}\n`);
  console.log(`🔓 Test tugas ${t.no} dibuka (status tes). Kunci lagi setelah diperbaiki.`);
  process.exit(0);
}

if (t.status !== 'tes') die(`Tugas ${t.no} berstatus "${t.status}", harus "tes".`);
const c = cekTugas(root, m, t);
if (!c.ok) die(`Tugas ${t.no} belum sah: ${c.alasan.join('; ')}`);
if (!t.tes.length) die('Kolom tes kosong.');
if (!/```/.test(bagian(t.teks, 'Bukti RED') || ''))
  die('Bagian "## Bukti RED" belum berisi output test yang gagal (blok kode). Lihat R12.');
const files = {};
for (const f of t.tes) {
  if (f.includes('*')) die(`Kolom tes harus path persis, bukan glob: ${f}`);
  if (!existsSync(join(root, f))) die(`File test tidak ada: ${f}`);
  files[f] = hashFile(join(root, f));
}
const gabung = t.tes.map((f) => readFileSync(join(root, f), 'utf8')).join('\n');
const kurang = t.butir.filter((x) => /^K\d+$/.test(x) && !gabung.includes(`[${x}]`));
if (kurang.length) die(`Belum ada test bernama ${kurang.map((x) => `[${x}]`).join(', ')} di file tes.`);
kunci[t.no] = files;
tulisJson(kunciPath(root, m), kunci);
setStatusTugas(t.path, 'siap');
console.log(`🔒 ${t.tes.length} file test tugas ${t.no} dikunci. Status: siap.`);
