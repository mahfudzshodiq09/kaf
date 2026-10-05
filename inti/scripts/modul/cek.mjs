#!/usr/bin/env node
// Validasi satu modul: batas ukuran, format keputusan & tugas, telusur [ID] di test, test terkunci utuh.
// Pemakaian: node scripts/modul/cek.mjs <nnn>
import { findModule, isV2, periksaModul, tahapModul } from './lib.mjs';

const root = process.env.MODUL_ROOT || process.cwd();
const m = findModule(root, process.argv[2]);
if (!m || !isV2(root, m)) {
  console.error('Pemakaian: node scripts/modul/cek.mjs <nnn>  (modul v2)');
  process.exit(1);
}
const { galat, peringatan } = periksaModul(root, m);
const { tahap, berikut } = tahapModul(root, m);
for (const g of galat) console.log(`❌ ${g}`);
for (const p of peringatan) console.log(`⚠️  ${p}`);
console.log(
  `${galat.length ? '❌' : '✅'} ${m}: ${galat.length} galat, ${peringatan.length} peringatan · tahap ${tahap} · berikut: ${berikut}`,
);
process.exit(galat.length ? 1 : 0);
