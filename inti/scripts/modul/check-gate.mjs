#!/usr/bin/env node
// Gerbang CI /modul v2 — penjaga yang tidak bisa dilewati dari laptop. Aturan: docs/modul-v2/05-gate.md.
// Pemakaian di CI: node scripts/modul/check-gate.mjs <base-ref>
// Env: GITHUB_HEAD_REF (branch PR), NON_MODUL=true (label "non-modul"), PERAWATAN=true (label "perawatan-modul")
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import {
  git,
  proyek,
  LINDUNG,
  matchesAny,
  moduleFromBranch,
  currentBranch,
  moduleDir,
  isV2,
  bacaTugas,
  cekTugas,
  butirModul,
  bacaPersetujuan,
  periksaModul,
  reviewState,
  DOK,
  listModules,
} from './lib.mjs';

const root = process.env.MODUL_ROOT || process.cwd();
const base = process.argv[2] || 'origin/main';
const galat = [];
const info = (s) => console.log(`ℹ️  ${s}`);

const changed = git(root, ['diff', '--name-only', `${base}...HEAD`])
  .split('\n')
  .filter(Boolean);
const lindung = changed.filter(
  (f) => matchesAny(f, LINDUNG) && !/^PLAN\/[^/]+\/(persetujuan|kunci-tes)\.json$/.test(f),
);
if (lindung.length && process.env.PERAWATAN !== 'true')
  galat.push(`file penjaga /modul berubah tanpa label "perawatan-modul":\n    - ${lindung.join('\n    - ')}`);
for (const f of changed.filter((x) => /^PLAN\/[^/]+\/persetujuan\.json$/.test(x)))
  info(`${f} berubah — pastikan semua persetujuan di PR ini memang Anda yang memberi (CODEOWNERS).`);

const branch = process.env.GITHUB_HEAD_REF || currentBranch(root);
const modul = moduleFromBranch(branch);
const commits = git(root, ['rev-list', '--reverse', '--no-merges', `${base}..HEAD`])
  .split('\n')
  .filter(Boolean);
const { kode: KODE, selaluBoleh: SELALU } = proyek(root);
const guardedAll = changed.filter((f) => KODE.some((g) => f.startsWith(g)));

if (guardedAll.length) {
  if (!modul) {
    if (process.env.NON_MODUL === 'true') info(`PR non-modul (${branch}) — review pemilik wajib.`);
    else
      galat.push(
        `branch "${branch}" bukan branch modul (feat/<nnn>-<slug>). Beri label "non-modul" untuk hotfix/refactor lewat /ecc:orch-*.`,
      );
  } else if (!existsSync(moduleDir(root, modul)) || !isV2(root, modul)) {
    galat.push(`${modul}: bukan modul v2 (00-modul.md tidak ada).`);
  } else {
    const tugas = bacaTugas(root, modul);
    const butir = butirModul(root, modul);
    const p = bacaPersetujuan(root, modul);
    const dipakai = new Set();
    for (const c of commits) {
      const files = git(root, ['diff-tree', '--no-commit-id', '--name-only', '-r', c]).split('\n').filter(Boolean);
      const kode = files.filter((f) => KODE.some((g) => f.startsWith(g)));
      if (!kode.length) continue;
      const pesan = git(root, ['log', '-1', '--format=%B', c]);
      const tr = /^Tugas:\s*(\d+)\s*$/m.exec(pesan);
      const singkat = `${c.slice(0, 7)} "${pesan.split('\n')[0]}"`;
      if (!tr) {
        galat.push(`${singkat}: mengubah kode tanpa trailer "Tugas: N".`);
        continue;
      }
      const t = tugas.find((x) => x.no === Number(tr[1]));
      if (!t) {
        galat.push(`${singkat}: tugas ${tr[1]} tidak ada.`);
        continue;
      }
      dipakai.add(t.no);
      const luar = kode.filter((f) => !matchesAny(f, [...t.file, ...t.tes, ...SELALU]));
      if (luar.length) galat.push(`${singkat}: file di luar tugas ${t.no}:\n    - ${luar.join('\n    - ')}`);
    }
    for (const no of dipakai) {
      const t = tugas.find((x) => x.no === no);
      const c = cekTugas(root, modul, t, butir, p);
      if (!c.ok) galat.push(`tugas ${no} tidak sah di HEAD: ${c.alasan.join('; ')}`);
    }
  }
}

// Validasi semua modul v2 yang dokumennya berubah di PR ini (+ modul branch).
const modulBerubah = new Set(changed.map((f) => /^PLAN\/(\d{3}-[a-z0-9-]+)\//.exec(f)?.[1]).filter(Boolean));
if (modul) modulBerubah.add(modul);
for (const m of modulBerubah) {
  if (!listModules(root).includes(m) || !isV2(root, m)) continue;
  const { galat: g } = periksaModul(root, m);
  for (const x of g) galat.push(`${m}: ${x}`);
  // Gerbang UAT: semua tugas selesai & review mencakup isi file modul terakhir.
  if (existsSync(join(moduleDir(root, m), DOK.uat))) {
    const belum = bacaTugas(root, m).filter((t) => !['selesai', 'batal'].includes(t.status));
    if (belum.length) galat.push(`${m}: UAT belum boleh — tugas belum selesai: #${belum.map((t) => t.no).join(', #')}`);
    const rs = reviewState(root, m);
    if (!rs.ok) galat.push(`${m}: UAT belum boleh — ${rs.reason}`);
  }
}

if (galat.length) {
  for (const g of galat) console.error(`❌ [modul-gate] ${g}`);
  process.exit(1);
}
console.log(`✅ [modul-gate] lulus · ${commits.length} commit diperiksa${modul ? ` · modul ${modul}` : ''}`);
