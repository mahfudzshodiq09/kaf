#!/usr/bin/env node
// Mengubah status tugas dengan aturan transisi. Pemakaian: node scripts/modul/status.mjs <nnn> <no> <status> ["alasan"]
// (status "siap" hanya lewat kunci-tes.mjs; "perbaikan" dipasang Pemeriksa saat review FAIL)
import { appendFileSync } from 'node:fs';
import {
  findModule,
  isV2,
  bacaTugas,
  setStatusTugas,
  tugasAktif,
  cekTugas,
  bacaKunci,
  bagian,
  rapikan,
  git,
  STATUS_AKTIF,
} from './lib.mjs';

const root = process.env.MODUL_ROOT || process.cwd();
const [ref, noStr, ke, ...alasanArr] = process.argv.slice(2);
const alasan = alasanArr.join(' ').trim();
const die = (msg) => {
  console.error(`Ditolak: ${msg}`);
  process.exit(1);
};
const m = findModule(root, ref);
if (!m || !isV2(root, m) || !/^\d+$/.test(noStr || '') || !ke)
  die('pemakaian: node scripts/modul/status.mjs <nnn> <no> <status> ["alasan"]');
const semua = bacaTugas(root, m);
const t = semua.find((x) => x.no === Number(noStr));
if (!t) die(`tugas ${noStr} tidak ada.`);

const BOLEH = {
  rancang: ['tes', 'blokir', 'batal'],
  tes: ['rancang', 'blokir'],
  siap: ['kerja', 'blokir', 'batal'],
  kerja: ['selesai', 'blokir'],
  perbaikan: ['selesai', 'blokir'],
  selesai: ['perbaikan'],
  blokir: ['rancang', 'tes', 'siap', 'kerja', 'perbaikan', 'batal'],
  batal: [],
};
if (!(BOLEH[t.status] || []).includes(ke))
  die(`${t.status} → ${ke} tidak diizinkan (boleh: ${(BOLEH[t.status] || []).join(', ') || '–'}).`);
if (ke === 'siap' && !bacaKunci(root, m)[t.no]) die('status siap hanya lewat kunci-tes.mjs.');
if (['blokir', 'batal', 'perbaikan'].includes(ke) && !alasan) die(`status ${ke} wajib disertai alasan.`);

if (STATUS_AKTIF.includes(ke)) {
  const lain = tugasAktif(semua).filter((x) => x.no !== t.no);
  if (lain.length) die(`tugas #${lain.map((x) => x.no).join(', #')} masih aktif. Selesaikan/blokir dulu.`);
  const c = cekTugas(root, m, t);
  if (!c.ok) die(`tugas ${t.no} belum sah — ${c.alasan.join('; ')}.`);
}
if (['kerja', 'perbaikan'].includes(ke)) {
  const belum = t.bergantung.filter((b) => semua.find((x) => x.no === b)?.status !== 'selesai');
  if (belum.length) die(`bergantung pada tugas #${belum.join(', #')} yang belum selesai.`);
  if (!bacaKunci(root, m)[t.no]) die('test tugas ini belum dikunci.');
}
if (ke === 'selesai') {
  if (!rapikan((bagian(t.teks, 'Hasil') || '').replace(/^\(.*\)$/m, '')))
    die('isi dulu bagian "## Hasil" (model, output verifikasi asli, yang tidak dicek).');
  let ada = '';
  try {
    ada = git(root, ['log', '--format=%H', '-E', `--grep=^Tugas: ${t.no}$`, '-n', '1']);
  } catch {
    // bukan repo git → dianggap belum ada commit (ditolak di bawah)
  }
  if (!ada) die(`belum ada commit bertrailer "Tugas: ${t.no}".`);
}
if ((ke === 'kerja' || ke === 'perbaikan') && t.status === 'blokir' && !alasan)
  die('membuka blokir wajib disertai alasan.');

setStatusTugas(t.path, ke);
if (alasan) appendFileSync(t.path, `\n> ${new Date().toISOString().slice(0, 10)} · ${t.status} → ${ke}: ${alasan}\n`);
console.log(`Tugas ${t.no}: ${t.status} → ${ke}`);
