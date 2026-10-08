#!/usr/bin/env node
// kaf — pemasang & pembaru workflow /kaf v2 (sumber tunggal untuk semua project).
//   node <kaf>/bin/kaf.mjs install <project> [--profil monorepo-pnpm|nextjs-npm] [--app <nama>] [--tanpa-tes]
//   node <kaf>/bin/kaf.mjs update  <project> [--paksa] [--tanpa-tes]
//   node <kaf>/bin/kaf.mjs cek     <project...>
// Berkas "inti" milik kaf (ditimpa saat update); berkas "awal" & profil milik project (dipasang sekali, tidak pernah ditimpa).
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  copyFileSync,
  rmSync,
} from 'node:fs';
import { join, dirname, resolve, relative, basename, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const KAF = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const VERSI = JSON.parse(readFileSync(join(KAF, 'package.json'), 'utf8')).version;
export const MANIFEST = '.claude/modul/kaf.json';
const PROFIL = ['monorepo-pnpm', 'nextjs-npm'];
const SKRIP = {
  'modul:list': 'node scripts/modul/index.mjs',
  'modul:setujui': 'node scripts/modul/setujui.mjs',
  'modul:cek': 'node scripts/modul/cek.mjs',
  'modul:gate': 'node scripts/modul/check-gate.mjs',
  'modul:test': 'node --test scripts/modul/test/*.test.mjs',
};

const sha = (buf) => createHash('sha256').update(buf).digest('hex');
const hashFile = (p) => (existsSync(p) ? sha(readFileSync(p)) : null);
export function daftarBerkas(dir) {
  const out = [];
  const jalan = (d) => {
    for (const n of readdirSync(d)) {
      if (n === '.DS_Store') continue;
      const p = join(d, n);
      if (statSync(p).isDirectory()) jalan(p);
      else out.push(relative(dir, p).split(sep).join('/'));
    }
  };
  if (existsSync(dir)) jalan(dir);
  return out.sort();
}
function salin(src, dst) {
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
}
const bacaJson = (p, def) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : def);
const tulisJson = (p, o) => {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(o, null, 2) + '\n');
};
export const deteksiProfil = (t) => (existsSync(join(t, 'pnpm-workspace.yaml')) ? 'monorepo-pnpm' : 'nextjs-npm');

/** Berkas inti yang berlaku untuk project ini (workflow GitHub hanya bila project memakai .github/). */
export function berkasInti(target) {
  return daftarBerkas(join(KAF, 'inti')).filter(
    (r) => !r.startsWith('.github/') || existsSync(join(target, '.github')),
  );
}

// ── Penggabungan konfigurasi milik project ───────────────────────────────────
export function gabungSettings(target) {
  const p = join(target, '.claude/settings.json');
  const s = bacaJson(p, {});
  s.hooks ||= {};
  const pastikan = (event, matcher, skrip) => {
    const list = (s.hooks[event] ||= []);
    const cmd = `node "$CLAUDE_PROJECT_DIR/.claude/hooks/${skrip}"`;
    const ada = list.find((e) => (e.hooks || []).some((h) => String(h.command || '').includes(skrip)));
    if (ada) {
      ada.matcher = matcher;
      ada.hooks = ada.hooks.map((h) =>
        String(h.command || '').includes(skrip) ? { type: 'command', command: cmd } : h,
      );
    } else list.push({ matcher, hooks: [{ type: 'command', command: cmd }] });
  };
  pastikan('PreToolUse', 'Edit|Write|MultiEdit|NotebookEdit|Bash|Skill|SlashCommand', 'gate-modul.mjs');
  pastikan('UserPromptExpansion', 'kaf', 'setujui-ketik.mjs');
  tulisJson(p, s);
}
export function gabungPackage(target) {
  const p = join(target, 'package.json');
  if (!existsSync(p)) return false;
  const j = JSON.parse(readFileSync(p, 'utf8'));
  j.scripts ||= {};
  let ubah = false;
  for (const [k, v] of Object.entries(SKRIP))
    if (j.scripts[k] !== v) {
      j.scripts[k] = v;
      ubah = true;
    }
  if (ubah) writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  return ubah;
}
const BLOK = (pm) => `<!-- kaf:mulai — dikelola kaf, jangan diedit di antara penanda ini -->
## /kaf — workflow modul (kaf ${VERSI})

Fitur/modul baru lewat **\`/kaf\`**: \`plan "<ide>"\` (BRD) → \`prd <nnn>\` (PRD) → \`build <nnn> [3|1-10]\` (kode) → \`review <nnn>\` → \`uat\` → \`rilis\`.
Panduan \`docs/modul-v2/README.md\` · profil project \`.claude/modul/proyek.md\` · progres \`${pm} modul:list\`.

- **Mengetik \`/kaf prd\` = menyetujui BRD; mengetik \`/kaf build\` = menyetujui PRD** (dicatat hook). AI tidak memanggil keduanya, tidak mengedit \`persetujuan.json\`/\`kunci-tes.json\`, tidak menjalankan \`setujui\` (R6).
- Keputusan bisnis hanya di \`PLAN/<modul>/03-keputusan.md\`, ditanyakan sekali (R1–R2). Hanya file milik tugas aktif yang boleh diubah; ditolak penjaga → jelaskan, jangan diakali (R7).
- File penjaga (\`scripts/modul/\`, \`.claude/hooks/\`, \`.claude/modul/proyek.json\`, …) hanya diubah lewat \`kaf update\` atau sesi \`MODUL_PERAWATAN=1\`.
<!-- kaf:selesai -->`;
/** 'ganti' | 'tambah' | 'lewati' (CLAUDE.md sudah menjelaskan /kaf v2 tanpa penanda). */
export function gabungClaudeMd(target) {
  const p = join(target, 'CLAUDE.md');
  const pm = existsSync(join(target, 'pnpm-lock.yaml')) ? 'pnpm' : 'npm run';
  const t = existsSync(p) ? readFileSync(p, 'utf8') : '';
  const re = /<!-- kaf:mulai[\s\S]*?<!-- kaf:selesai -->/;
  if (re.test(t)) {
    writeFileSync(p, t.replace(re, BLOK(pm)));
    return 'ganti';
  }
  if (/\/(?:kaf|modul)`? v2|docs\/modul-v2/.test(t)) return 'lewati';
  writeFileSync(p, (t ? t.replace(/\s*$/, '\n\n') : '') + BLOK(pm) + '\n');
  return 'tambah';
}

// ── Tes di project ───────────────────────────────────────────────────────────
function jalankanTes(target) {
  const dir = join(target, 'scripts/modul/test');
  const files = daftarBerkas(dir)
    .filter((f) => f.endsWith('.test.mjs'))
    .map((f) => join('scripts/modul/test', f));
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT; // bila kaf dijalankan dari dalam test runner
  delete env.MODUL_PERAWATAN; // tes penjaga harus melihat kondisi normal
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files], {
    cwd: target,
    encoding: 'utf8',
    env,
  });
  const ambil = (k) => Number((new RegExp(`^# ${k} (\\d+)`, 'm').exec(r.stdout) || [])[1] || 0);
  return {
    lulus: ambil('pass'),
    gagal: ambil('fail'),
    total: ambil('tests'),
    ok: r.status === 0,
  };
}

// ── Perintah ─────────────────────────────────────────────────────────────────
export function install(target, { profil, app, tes = true } = {}) {
  if (existsSync(join(target, MANIFEST))) throw new Error(`kaf sudah terpasang di ${target} — pakai: kaf update`);
  profil ||= deteksiProfil(target);
  if (!PROFIL.includes(profil)) throw new Error(`profil tidak dikenal: ${profil} (pilihan: ${PROFIL.join(', ')})`);
  const laporan = { inti: 0, awal: [], profil };
  const berkas = {};
  for (const r of berkasInti(target)) {
    salin(join(KAF, 'inti', r), join(target, r));
    berkas[r] = hashFile(join(target, r));
    laporan.inti++;
  }
  const benih = [
    ...daftarBerkas(join(KAF, 'awal')).map((r) => [join(KAF, 'awal', r), r]),
    [join(KAF, 'profil', profil, 'proyek.json'), '.claude/modul/proyek.json'],
    [join(KAF, 'profil', profil, 'proyek.md'), '.claude/modul/proyek.md'],
  ];
  for (const [src, r] of benih) {
    const dst = join(target, r);
    if (existsSync(dst)) continue;
    salin(src, dst);
    laporan.awal.push(r);
    if (r.startsWith('.claude/modul/proyek.')) {
      const nama = app || basename(resolve(target));
      writeFileSync(
        dst,
        readFileSync(dst, 'utf8')
          .replaceAll('<app>', nama)
          .replaceAll('<nama>', basename(resolve(target))),
      );
    }
  }
  gabungSettings(target);
  laporan.package = gabungPackage(target);
  laporan.claudeMd = gabungClaudeMd(target);
  const now = new Date().toISOString();
  tulisJson(join(target, MANIFEST), {
    versi: VERSI,
    profil,
    dipasang: now,
    diperbarui: now,
    berkas,
  });
  if (tes) laporan.tes = jalankanTes(target);
  return laporan;
}

export function update(target, { paksa = false, tes = true } = {}) {
  const man = bacaJson(join(target, MANIFEST), null);
  if (!man) throw new Error(`kaf belum terpasang di ${target} — pakai: kaf install`);
  const laporan = {
    dari: man.versi,
    ke: VERSI,
    diperbarui: [],
    baru: [],
    sama: 0,
    dilewati: [],
    dihapus: [],
    tertahan: [],
    gagalHapus: [],
  };
  const berkas = {};
  const inti = berkasInti(target);
  for (const r of inti) {
    const src = join(KAF, 'inti', r);
    const dst = join(target, r);
    const cur = hashFile(dst);
    const neu = hashFile(src);
    const lama = man.berkas?.[r];
    if (cur === neu) {
      berkas[r] = neu;
      laporan.sama++;
    } else if (cur === null || cur === lama || paksa) {
      salin(src, dst);
      berkas[r] = neu;
      (cur === null ? laporan.baru : laporan.diperbarui).push(r);
    } else {
      berkas[r] = lama ?? null;
      laporan.dilewati.push(r); // diubah lokal → tidak ditimpa tanpa --paksa
    }
  }
  for (const [r, lama] of Object.entries(man.berkas || {})) {
    if (inti.includes(r)) continue;
    const dst = join(target, r);
    if (!existsSync(dst)) continue;
    if (hashFile(dst) === lama || paksa) {
      try {
        rmSync(dst);
        laporan.dihapus.push(r);
      } catch (e) {
        berkas[r] = lama; // dicoba lagi pada update berikutnya
        laporan.gagalHapus.push(`${r} (${e.code || e.message})`);
      }
    } else laporan.tertahan.push(r);
  }
  gabungSettings(target);
  laporan.package = gabungPackage(target);
  laporan.claudeMd = gabungClaudeMd(target);
  tulisJson(join(target, MANIFEST), {
    ...man,
    versi: VERSI,
    diperbarui: new Date().toISOString(),
    berkas,
  });
  if (tes) laporan.tes = jalankanTes(target);
  return laporan;
}

export function cek(target) {
  const man = bacaJson(join(target, MANIFEST), null);
  if (!man) return { terpasang: false };
  const diubah = [];
  const hilang = [];
  for (const [r, h] of Object.entries(man.berkas || {})) {
    const cur = hashFile(join(target, r));
    if (cur === null) hilang.push(r);
    else if (cur !== h) diubah.push(r);
  }
  return {
    terpasang: true,
    versi: man.versi,
    profil: man.profil,
    terbaru: man.versi === VERSI,
    diubah,
    hilang,
  };
}

// ── CLI ──────────────────────────────────────────────────────────────────────
function cli(argv) {
  const [perintah, ...sisa] = argv;
  const opsi = {};
  const posisi = [];
  for (let i = 0; i < sisa.length; i++) {
    if (sisa[i] === '--paksa') opsi.paksa = true;
    else if (sisa[i] === '--tanpa-tes') opsi.tes = false;
    else if (sisa[i] === '--profil') opsi.profil = sisa[++i];
    else if (sisa[i] === '--app') opsi.app = sisa[++i];
    else posisi.push(sisa[i]);
  }
  const bantuan = `kaf ${VERSI} — workflow /kaf v2
  kaf install <project> [--profil monorepo-pnpm|nextjs-npm] [--app <nama>] [--tanpa-tes]
  kaf update  <project> [--paksa] [--tanpa-tes]
  kaf cek     <project...>`;
  if (!perintah || !posisi.length || !['install', 'update', 'cek'].includes(perintah)) {
    console.log(bantuan);
    process.exit(perintah ? 1 : 0);
  }
  if (process.env.CLAUDECODE && perintah !== 'cek' && process.env.MODUL_PERAWATAN !== '1') {
    console.error(
      'Ditolak: kaf install/update mengganti file penjaga — jalankan sendiri di terminal Anda (atau MODUL_PERAWATAN=1).',
    );
    process.exit(1);
  }
  const tesTeks = (t) =>
    t ? `\n  tes /kaf: ${t.lulus}/${t.total} lulus${t.gagal ? ` — ❌ ${t.gagal} GAGAL` : ''}` : '';
  let gagal = false;
  for (const p of posisi) {
    const target = resolve(p);
    try {
      if (perintah === 'install') {
        const l = install(target, opsi);
        console.log(
          `✅ kaf ${VERSI} terpasang di ${target} (profil ${l.profil})\n  inti: ${l.inti} berkas` +
            `\n  awal (baru): ${l.awal.join(', ') || '–'}\n  CLAUDE.md: ${l.claudeMd} · package.json: ${l.package ? 'skrip modul:* ditambah' : 'tetap'}${tesTeks(l.tes)}` +
            (l.awal.some((r) => r.includes('proyek.'))
              ? '\n  ➜ lengkapi .claude/modul/proyek.md dan nama model 9router di .claude/modul/model.json, lalu cek: node scripts/modul/bangun.mjs --cek'
              : ''),
        );
        gagal ||= l.tes && !l.tes.ok;
      } else if (perintah === 'update') {
        const l = update(target, opsi);
        console.log(
          `✅ ${target}: kaf ${l.dari} → ${l.ke}\n  diperbarui: ${l.diperbarui.length} · baru: ${l.baru.length} · sama: ${l.sama} · dihapus: ${l.dihapus.length}` +
            (l.dilewati.length
              ? `\n  ⚠️  diubah lokal, TIDAK ditimpa (pakai --paksa bila memang mau): ${l.dilewati.join(', ')}`
              : '') +
            (l.tertahan.length
              ? `\n  ⚠️  sudah tidak dipakai tapi diubah lokal, tidak dihapus: ${l.tertahan.join(', ')}`
              : '') +
            (l.gagalHapus.length
              ? `\n  ⚠️  sudah tidak dipakai tapi GAGAL dihapus — hapus manual: ${l.gagalHapus.join(', ')}`
              : '') +
            `\n  CLAUDE.md: ${l.claudeMd}${tesTeks(l.tes)}`,
        );
        gagal ||= l.tes && !l.tes.ok;
      } else {
        const c = cek(target);
        if (!c.terpasang) console.log(`– ${target}: kaf belum terpasang`);
        else
          console.log(
            `${c.terbaru && !c.diubah.length && !c.hilang.length ? '✅' : '⚠️ '} ${target}: kaf ${c.versi}${c.terbaru ? '' : ` (terbaru ${VERSI} → kaf update)`} · profil ${c.profil}` +
              (c.diubah.length ? `\n  diubah lokal: ${c.diubah.join(', ')}` : '') +
              (c.hilang.length ? `\n  hilang: ${c.hilang.join(', ')}` : ''),
          );
      }
    } catch (e) {
      console.error(`❌ ${target}: ${e.message}`);
      gagal = true;
    }
  }
  process.exit(gagal ? 1 : 0);
}
if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) cli(process.argv.slice(2));
