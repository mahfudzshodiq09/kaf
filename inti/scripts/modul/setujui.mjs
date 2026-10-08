#!/usr/bin/env node
// Persetujuan butir oleh PEMILIK, di terminal interaktif. AI tidak bisa menjalankannya (docs/modul-v2/05-gate.md).
// Pemakaian: node scripts/modul/setujui.mjs <nnn> [--lihat]
import { createInterface } from 'node:readline/promises';
import {
  findModule,
  isV2,
  butirMenunggu,
  butirModul,
  bacaPersetujuan,
  statusButir,
  LABEL_STATUS,
  catatPersetujuan,
  git,
  DOK,
  moduleDir,
  read,
  penolakanSetujui,
} from './lib.mjs';
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.env.MODUL_ROOT || process.cwd();
const [ref, opsi] = process.argv.slice(2);
const keluar = (msg, code = 1) => {
  console.error(msg);
  process.exit(code);
};
const m = findModule(root, ref);
if (!m) keluar('Pemakaian: node scripts/modul/setujui.mjs <nnn> [--lihat]');
if (!isV2(root, m)) keluar(`${m} bukan modul v2.`);

const butir = butirModul(root, m);
const p = bacaPersetujuan(root, m);
const menunggu = butirMenunggu(root, m);
const tunda = [...butir.values()].filter((b) => statusButir(b.id, butir, p) === 'tunda');

console.log(`\n${m}: ${menunggu.length} butir menunggu persetujuan, ${tunda.length} masih ⏳.`);
for (const b of tunda) console.log(`  ⏳ ${b.id} — ${LABEL_STATUS.tunda}`);
if (opsi === '--lihat' || !menunggu.length) {
  for (const b of menunggu) console.log(`  • ${b.id} (${LABEL_STATUS[statusButir(b.id, butir, p)]})`);
  process.exit(0);
}

const alasanTolak = penolakanSetujui(process.env, process.stdin.isTTY, process.stdout.isTTY);
if (alasanTolak) keluar(`Ditolak: ${alasanTolak}`);

let oleh = 'pemilik';
try {
  oleh = git(root, ['config', 'user.name']) || oleh;
} catch {
  // git tidak tersedia: tetap pakai nama "pemilik"
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
let disetujui = 0;
for (const b of menunggu) {
  const s = statusButir(b.id, butir, p);
  console.log('\n' + '─'.repeat(70));
  console.log(`${b.id}  (${LABEL_STATUS[s]})`);
  console.log('─'.repeat(70));
  console.log(b.teks.length > 4000 ? b.teks.slice(0, 4000) + '\n… (terpotong — baca lengkap di file)' : b.teks);
  const j = (await rl.question('\n[y] setujui  [n] lewati  [k] komentar  [q] keluar > ')).trim().toLowerCase();
  if (j === 'q') break;
  if (j === 'y') {
    catatPersetujuan(root, m, b.id, oleh);
    disetujui++;
    console.log(`✅ ${b.id} disetujui`);
  } else if (j === 'k') {
    const isi = (await rl.question('Komentar: ')).trim();
    if (isi) {
      const f = join(
        moduleDir(root, m),
        b.jenis === 'keputusan'
          ? DOK.keputusan
          : b.id === 'UAT'
            ? DOK.uat
            : b.id === 'RILIS'
              ? DOK.rilis
              : DOK.rancangan,
      );
      appendFileSync(f, `${read(f).endsWith('\n') ? '' : '\n'}\n> 💬 ${b.id} (${oleh}): ${isi}\n`);
      console.log(`💬 dicatat di ${f.split('/PLAN/')[1] || f}`);
    }
  }
}
rl.close();
console.log(`\nSelesai: ${disetujui} butir disetujui. Lanjutkan di Claude Code: /kaf ${m.slice(0, 3)}`);
