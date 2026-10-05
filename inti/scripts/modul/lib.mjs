// Utilitas bersama /modul v2 (tanpa dependency). Desain: docs/modul-v2/.
// Dipakai oleh: .claude/hooks/gate-modul.mjs, .opencode/plugins/gate-modul.js, scripts/modul/*.mjs
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, isAbsolute, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const DOK = {
  modul: '00-modul.md',
  konteks: '01-konteks.md',
  solusi: '02-solusi.md',
  keputusan: '03-keputusan.md',
  rancangan: '04-rancangan.md',
  review: '05-review.md',
  uat: '06-uat.md',
  rilis: '07-rilis.md',
};
// Folder kode yang dijaga & file yang selalu boleh diubah — per project di .claude/modul/proyek.json.
export const GUARDED = ['apps/', 'packages/'];
export const SELALU_BOLEH = ['apps/*/package.json', 'packages/*/package.json', 'pnpm-lock.yaml'];
/** { kode: [...prefix folder], selaluBoleh: [...glob] } dari .claude/modul/proyek.json (default: monorepo apps/packages). */
export function proyek(root) {
  const f = join(root, '.claude/modul/proyek.json');
  const c = existsSync(f) ? bacaJson(f) : {};
  return { kode: c.kode?.length ? c.kode : GUARDED, selaluBoleh: c.selaluBoleh || SELALU_BOLEH, app: c.app || '' };
}
export const diKode = (root, rel) => proyek(root).kode.some((g) => rel.startsWith(g));
export const LINDUNG = [
  'scripts/modul/**',
  '.claude/hooks/**',
  '.claude/settings.json',
  '.opencode/plugins/**',
  'opencode.json',
  '.claude/modul/proyek.json',
  '.claude/modul/kaf.json',
  '.github/workflows/modul-gate.yml',
  'PLAN/*/persetujuan.json',
  'PLAN/*/kunci-tes.json',
];
export const STATUS = ['rancang', 'tes', 'siap', 'kerja', 'selesai', 'perbaikan', 'blokir', 'batal'];
export const STATUS_AKTIF = ['tes', 'kerja', 'perbaikan'];
export const BATAS_BARIS = { modul: 60, konteks: 250, solusi: 120, rancangan: 400, uat: 200, rilis: 150, tugas: 100 };

// ── Dasar ────────────────────────────────────────────────────────────────────
export const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null);
export const sha = (s) => createHash('sha256').update(s).digest('hex');
export const rapikan = (s) =>
  (s || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
export const daftar = (v) =>
  (v || '')
    .split(',')
    .map((s) => s.trim().replace(/`/g, ''))
    .filter(Boolean);
export const posix = (p) => p.split('\\').join('/');
export function relPath(root, p) {
  const r = posix(isAbsolute(p) ? relative(root, p) : p);
  return r.startsWith('./') ? r.slice(2) : r;
}
export function tulisJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}
export function bacaJson(path) {
  const t = read(path);
  if (!t) return {};
  try {
    return JSON.parse(t);
  } catch {
    throw new Error(`${path} bukan JSON yang valid — jangan diedit manual`);
  }
}
export function git(root, args) {
  return execFileSync('git', args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 })
    .toString()
    .trim();
}

// ── Modul ────────────────────────────────────────────────────────────────────
/** feat/012-krs-mahasiswa → "012-krs-mahasiswa" */
export function moduleFromBranch(branch) {
  const m = /^(?:feat|fix|refactor|chore|docs)\/(\d{3}-[a-z0-9-]+)/.exec(branch || '');
  return m ? m[1] : null;
}
export function currentBranch(root) {
  try {
    return git(root, ['rev-parse', '--abbrev-ref', 'HEAD']);
  } catch {
    return null;
  }
}
export const activeModule = (root) => moduleFromBranch(currentBranch(root));
export const moduleDir = (root, m) => join(root, 'PLAN', m);
export function listModules(root) {
  const dir = join(root, 'PLAN');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{3}-/.test(d.name))
    .map((d) => d.name)
    .sort();
}
/** "2" | "002" | "002-cuti" → "002-cuti" */
export function findModule(root, ref) {
  if (!ref) return null;
  const num = /^\d+$/.test(ref) ? ref.padStart(3, '0') : ref.slice(0, 3);
  return listModules(root).find((m) => m === ref || m.startsWith(num + '-')) || null;
}
export const isV2 = (root, m) => existsSync(join(moduleDir(root, m), DOK.modul));

// ── Glob ─────────────────────────────────────────────────────────────────────
export function globToRegex(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i];
    if (ch === '*') {
      if (glob[i + 1] === '*') {
        re += '.*';
        i++;
        if (glob[i + 1] === '/') i++;
      } else re += '[^/]*';
    } else if ('.+?^${}()|[]\\'.includes(ch)) re += '\\' + ch;
    else re += ch;
  }
  return new RegExp('^' + re + '$');
}
export const matchesAny = (file, globs) => globs.some((g) => globToRegex(g).test(file));

// ── Keputusan (03-keputusan.md) ──────────────────────────────────────────────
const sel = (line) =>
  line
    .split('|')
    .slice(1, -1)
    .map((s) => s.trim());

/** Baris tabel yang sel pertamanya K<n>: | ID | Kalau | Maka | Sumber | Status | */
export function parseKeputusan(text) {
  const rows = [];
  (text || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .forEach((line, idx) => {
      if (!line.startsWith('|')) return;
      const c = sel(line);
      if (!/^K\d+$/.test(c[0] || '')) return;
      rows.push({
        id: c[0],
        kalau: c[1] || '',
        maka: c[2] || '',
        sumber: c[3] || '',
        status: c[4] || '',
        sel: c.length,
        baris: idx,
      });
    });
  return rows;
}
export const hashKeputusan = (r) => sha(`${r.id}\n${rapikan(r.kalau)}\n${rapikan(r.maka)}`);
export const kosongAtauTunda = (s) => !rapikan(s) || /⏳/.test(s);

/** Isi bagian "## <judul>" sampai "## " berikutnya; null bila tidak ada. */
export function bagian(text, judul) {
  const lines = (text || '').replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((l) => new RegExp('^##\\s+' + judul + '\\b', 'i').test(l));
  if (start < 0) return null;
  const out = [];
  for (let i = start + 1; i < lines.length && !/^##\s/.test(lines[i]); i++) out.push(lines[i].replace(/\s+$/, ''));
  return out.join('\n').trim();
}
/** Hash dokumen utuh tanpa baris | Status … | dan | Diperbarui | (dipakai UAT & RILIS). */
export const hashDokumen = (text) =>
  sha(
    (text || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .filter((l) => !/^\|\s*(Status|Diperbarui)\b[^|]*\|/.test(l))
      .map((l) => l.replace(/\s+$/, ''))
      .join('\n')
      .trim(),
  );

/** Semua butir yang bisa disetujui di modul: Map id → { id, jenis, hash, tunda, teks } */
export function butirModul(root, m) {
  const d = moduleDir(root, m);
  const out = new Map();
  for (const r of parseKeputusan(read(join(d, DOK.keputusan)))) {
    out.set(r.id, {
      id: r.id,
      jenis: 'keputusan',
      hash: hashKeputusan(r),
      tunda: kosongAtauTunda(r.maka) || !rapikan(r.kalau),
      teks: `Kalau: ${r.kalau}\nMaka : ${r.maka}\nSumber: ${r.sumber}`,
    });
  }
  const rancangan = read(join(d, DOK.rancangan));
  for (const [id, judul] of [
    ['DATA', 'Data'],
    ['KONTRAK', 'Kontrak'],
  ]) {
    const b = bagian(rancangan, judul);
    if (b !== null) out.set(id, { id, jenis: 'bagian', hash: sha(b), tunda: !b || /⏳/.test(b), teks: b });
  }
  for (const [id, f] of [
    ['UAT', DOK.uat],
    ['RILIS', DOK.rilis],
  ]) {
    const t = read(join(d, f));
    if (t !== null) out.set(id, { id, jenis: 'dokumen', hash: hashDokumen(t), tunda: /⏳/.test(t), teks: t });
  }
  return out;
}

// ── Persetujuan (persetujuan.json) ───────────────────────────────────────────
export const persetujuanPath = (root, m) => join(moduleDir(root, m), 'persetujuan.json');
export const bacaPersetujuan = (root, m) => bacaJson(persetujuanPath(root, m));

/** 'sah' | 'belum' | 'berubah' | 'tunda' | 'tidak-ada' */
export function statusButir(id, butir, persetujuan) {
  const b = butir.get(id);
  if (!b) return 'tidak-ada';
  if (b.tunda) return 'tunda';
  const rec = persetujuan[id];
  if (!rec?.hash) return 'belum';
  return rec.hash === b.hash ? 'sah' : 'berubah';
}
export const LABEL_STATUS = {
  'tidak-ada': 'tidak ditemukan',
  tunda: 'masih ⏳ / kosong',
  belum: 'belum disetujui',
  berubah: 'berubah sejak disetujui',
};
/** Butir yang bisa disetujui sekarang (belum/berubah, tidak tunda). */
export function butirMenunggu(root, m) {
  const butir = butirModul(root, m);
  const p = bacaPersetujuan(root, m);
  return [...butir.values()].filter((b) => ['belum', 'berubah'].includes(statusButir(b.id, butir, p)));
}
/** Catat persetujuan satu butir (dipanggil HANYA dari setujui.mjs). */
export function catatPersetujuan(root, m, id, oleh, tanggal = new Date().toISOString().slice(0, 10)) {
  const butir = butirModul(root, m);
  const b = butir.get(id);
  if (!b) throw new Error(`Butir ${id} tidak ditemukan`);
  if (b.tunda) throw new Error(`Butir ${id} masih ⏳ / kosong — tidak bisa disetujui`);
  const p = bacaPersetujuan(root, m);
  p[id] = { hash: b.hash, tanggal, oleh };
  tulisJson(persetujuanPath(root, m), p);
  if (b.jenis === 'keputusan') tulisStatusKeputusan(root, m, id, `✅ ${tanggal}`);
  if (b.jenis === 'dokumen') {
    const f = join(moduleDir(root, m), id === 'UAT' ? DOK.uat : DOK.rilis);
    const t = read(f).replace(/^(\|\s*Status\b[^|]*\|)[^|\n]*(\|)/m, `$1 ✅ Disetujui ${tanggal} $2`);
    writeFileSync(f, t);
  }
}
function tulisStatusKeputusan(root, m, id, status) {
  const f = join(moduleDir(root, m), DOK.keputusan);
  const lines = read(f).replace(/\r\n/g, '\n').split('\n');
  const i = lines.findIndex((l) => l.startsWith('|') && sel(l)[0] === id);
  if (i < 0) return;
  const c = sel(lines[i]);
  while (c.length < 5) c.push('');
  c[4] = status;
  lines[i] = '| ' + c.join(' | ') + ' |';
  writeFileSync(f, lines.join('\n'));
}

// ── Tugas (tugas/NN-*.md) ────────────────────────────────────────────────────
export function parseFrontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---/.exec((text || '').replace(/\r\n/g, '\n'));
  if (!m) return null;
  const o = {};
  for (const line of m[1].split('\n')) {
    const kv = /^([a-z]+):\s*(.*)$/.exec(line.trim());
    if (kv) o[kv[1]] = kv[2].trim();
  }
  return o;
}
export function bacaTugas(root, m) {
  const dir = join(moduleDir(root, m), 'tugas');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const path = join(dir, f);
      const teks = read(path);
      const fm = parseFrontmatter(teks);
      if (!fm || !/^\d+$/.test(fm.no || '')) return null;
      return {
        no: Number(fm.no),
        judul: fm.judul || '',
        butir: daftar(fm.butir),
        file: daftar(fm.file),
        tes: daftar(fm.tes),
        bergantung: daftar(fm.bergantung).map(Number),
        status: fm.status || 'rancang',
        path,
        teks,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.no - b.no);
}
export function setStatusTugas(path, status) {
  const t = read(path).replace(/\r\n/g, '\n');
  if (!/^---\n[\s\S]*?^status:.*$/m.test(t)) throw new Error(`${path}: baris "status:" tidak ada di frontmatter`);
  writeFileSync(path, t.replace(/^status:.*$/m, `status: ${status}`));
}
export const tugasAktif = (tugas) => tugas.filter((t) => STATUS_AKTIF.includes(t.status));

/** Tugas sah bila semua butirnya sah. */
export function cekTugas(root, m, t, butir = butirModul(root, m), p = bacaPersetujuan(root, m)) {
  const alasan = [];
  if (!t.butir.length) alasan.push('kolom butir kosong');
  for (const id of t.butir) {
    const s = statusButir(id, butir, p);
    if (s !== 'sah') alasan.push(`${id} ${LABEL_STATUS[s]}`);
  }
  return { ok: !alasan.length, alasan };
}

// ── Kunci test (kunci-tes.json) ──────────────────────────────────────────────
export const kunciPath = (root, m) => join(moduleDir(root, m), 'kunci-tes.json');
export const bacaKunci = (root, m) => bacaJson(kunciPath(root, m));
export function hashFile(abs) {
  const t = read(abs);
  return t === null ? null : sha(t.replace(/\r\n/g, '\n'));
}
/** Map path → { no, hash } untuk semua test yang dikunci di modul. */
export function tesTerkunci(root, m) {
  const k = bacaKunci(root, m);
  const out = new Map();
  for (const [no, files] of Object.entries(k))
    for (const [f, h] of Object.entries(files)) out.set(f, { no: Number(no), hash: h });
  return out;
}

// ── Penjaga ──────────────────────────────────────────────────────────────────
/**
 * Boleh mengubah file ini? null = boleh, string = alasan ditolak.
 * Dipakai hook Claude Code, plugin OpenCode, dan periksaBash. Aturan: docs/modul-v2/05-gate.md.
 */
export function periksaFile(root, file, { perawatan = process.env.MODUL_PERAWATAN === '1' } = {}) {
  const rel = relPath(root, file);
  if (matchesAny(rel, LINDUNG))
    return perawatan
      ? null
      : `${rel} adalah file penjaga /modul. Hanya boleh diubah saat pemilik membuka tool dengan MODUL_PERAWATAN=1.`;
  if (!diKode(root, rel)) return null;
  const m = activeModule(root);
  if (!m) return null; // branch non-modul → CI meminta label "non-modul"
  if (!existsSync(moduleDir(root, m))) return `branch merujuk modul ${m} tetapi PLAN/${m}/ tidak ada.`;
  if (!isV2(root, m)) return `${m} memakai /modul v1 yang sudah diarsipkan. Buat modul v2 atau pakai branch non-modul.`;
  const tugas = bacaTugas(root, m);
  const aktif = tugasAktif(tugas);
  if (aktif.length !== 1)
    return `${m}: harus tepat 1 tugas aktif (tes/kerja/perbaikan), sekarang ${aktif.length}${aktif.length ? ' (#' + aktif.map((t) => t.no).join(', #') + ')' : ''}. Pakai node scripts/modul/status.mjs.`;
  const t = aktif[0];
  const c = cekTugas(root, m, t);
  if (!c.ok)
    return `${m}: tugas ${t.no} belum sah — ${c.alasan.join('; ')}. Pemilik menyetujui dengan mengetik /modul build ${m.slice(0, 3)} (atau node scripts/modul/setujui.mjs ${m.slice(0, 3)}).`;
  if (t.status === 'tes')
    return matchesAny(rel, t.tes) || matchesAny(rel, t.file)
      ? null
      : `${m}: tugas ${t.no} berstatus "tes" — hanya file tes & stub di file: (${[...t.tes, ...t.file].join(', ')}).`;
  const kunci = tesTerkunci(root, m).get(rel);
  if (kunci)
    return `${rel} adalah test terkunci (tugas ${kunci.no}). Bila test-nya salah: tandai tugas blokir + tulis alasannya; Perancang Uji membuka dengan kunci-tes --buka.`;
  if (matchesAny(rel, t.file) || matchesAny(rel, proyek(root).selaluBoleh)) return null;
  return `${rel} bukan file tugas ${t.no} (file: ${t.file.join(', ')}). Bila memang perlu: usulkan perubahan tugas, jangan dikerjakan diam-diam.`;
}

const SEGMEN_TULIS =
  /^\s*(?:sudo\s+)?(?:tee|sed\s+(?:-[a-zA-Z]*i|--in-place)|perl\s+-\w*i|mv|cp|rm|truncate|chmod|ln|install|rsync|dd|touch|git\s+(?:checkout|restore|apply|rm|mv))\b/;
const API_TULIS = /writeFile|appendFile|unlinkSync|renameSync|rmSync|cpSync|copyFile/;

/**
 * Perintah Bash boleh? null = boleh. Penghalang untuk agent ceroboh (bukan penyerang); CI tetap penjaga akhir.
 * alat: 'claude' | 'opencode' (pembangun; lebih ketat).
 */
export function periksaBash(root, command, { alat = 'claude', perawatan = process.env.MODUL_PERAWATAN === '1' } = {}) {
  const c = command || '';
  if (c.split(/;|&&|\|\||\|/).some((seg) => /\bsetujui(\.mjs)?\b|modul:setujui/.test(seg) && !/\s--lihat\b/.test(seg)))
    return 'persetujuan hanya boleh dijalankan pemilik di terminalnya sendiri (scripts/modul/setujui.mjs).';
  if (/--no-verify\b/.test(c)) return '--no-verify dilarang (melewati pengecekan commit).';
  if (!perawatan && /\bkaf(\.mjs)?\s+(install|update)\b/.test(c))
    return 'memasang/memperbarui kaf mengganti file penjaga — hanya oleh pemilik di terminalnya (atau MODUL_PERAWATAN=1).';
  if (/\bclaude\b[\s\S]*\/modul\s+(prd|build)\b/.test(c))
    return '/modul prd dan /modul build sekaligus persetujuan — hanya boleh diketik pemilik, tidak dijalankan lewat Bash.';
  if (alat === 'opencode' && /kunci-tes|scripts\/modul\/review|--buka\b/.test(c))
    return 'pembangun tidak boleh mengunci/membuka test atau memasang cap review.';
  for (const seg of c.split(/;|&&|\|\||\|/)) {
    const target = [...seg.matchAll(/(?:^|[^0-9&>])>{1,2}\s*([^\s;|&<>]+)/g)].map((x) => x[1]);
    if (SEGMEN_TULIS.test(seg) || API_TULIS.test(seg)) target.push(...seg.split(/[\s'"=(),]+/));
    for (const raw of target) {
      const tok = raw.replace(/^['"]|['"]$/g, '');
      if (!tok || tok.startsWith('-') || tok === '/dev/null') continue;
      const rel = relPath(root, tok);
      if (!diKode(root, rel) && !matchesAny(rel, LINDUNG)) continue;
      const alasan = periksaFile(root, tok, { perawatan });
      if (alasan) return `lewat Bash: ${alasan}`;
    }
  }
  return null;
}

// ── Cap review ───────────────────────────────────────────────────────────────
export const globModul = (tugas) => [
  ...new Set(tugas.filter((t) => t.status !== 'batal').flatMap((t) => [...t.file, ...t.tes])),
];
/** Sidik jari isi file modul pada HEAD (path + blob id). Tahan rebase/merge. */
export function codeDigest(root, globs) {
  const raw = git(root, ['ls-tree', '-r', '-z', 'HEAD', '--', ...proyek(root).kode]);
  const entries = [];
  for (const rec of raw.split('\0').filter(Boolean)) {
    const tab = rec.indexOf('\t');
    const blob = rec.slice(0, tab).split(' ')[2];
    const path = rec.slice(tab + 1);
    if (matchesAny(path, globs)) entries.push(path + ' ' + blob);
  }
  entries.sort();
  return { digest: sha(entries.join('\n')), count: entries.length };
}
export function selHeader(text, label) {
  const m = new RegExp('^\\|\\s*' + label + '\\s*\\|\\s*`?([^|`]*)`?\\s*\\|', 'm').exec(text || '');
  return m ? m[1].trim() : null;
}
export function reviewState(root, m) {
  const text = read(join(moduleDir(root, m), DOK.review));
  if (!text) return { ok: false, reason: `${DOK.review} belum ada → /modul ${m.slice(0, 3)} review` };
  const cap = selHeader(text, 'Cap kode');
  if (!/^[0-9a-f]{64}$/.test(cap || '')) return { ok: false, reason: 'review belum dicap (scripts/modul/review.mjs)' };
  let now;
  try {
    now = codeDigest(root, globModul(bacaTugas(root, m))).digest;
  } catch {
    return { ok: false, reason: 'tidak bisa membaca git untuk memeriksa cap review' };
  }
  return now === cap
    ? { ok: true }
    : { ok: false, reason: 'isi file modul berubah sejak review terakhir → review lagi' };
}

// ── Validasi modul (cek.mjs & CI) ────────────────────────────────────────────
export function periksaModul(root, m) {
  const d = moduleDir(root, m);
  const galat = [];
  const peringatan = [];
  for (const [k, f] of Object.entries(DOK)) {
    const t = read(join(d, f));
    const n = t ? t.split('\n').length : 0;
    if (BATAS_BARIS[k] && n > BATAS_BARIS[k])
      galat.push(`${f}: ${n} baris (batas ${BATAS_BARIS[k]}) — ringkas atau pecah modul`);
  }
  const kep = parseKeputusan(read(join(d, DOK.keputusan)));
  const seen = new Set();
  for (const r of kep) {
    if (seen.has(r.id)) galat.push(`03-keputusan: ID ${r.id} dipakai dua kali`);
    seen.add(r.id);
    if (r.sel < 5) galat.push(`03-keputusan: baris ${r.id} harus punya 5 kolom (ID | Kalau | Maka | Sumber | Status)`);
    for (const [nama, isi] of [
      ['Kalau', r.kalau],
      ['Maka', r.maka],
    ])
      if (isi.length > 300)
        peringatan.push(`03-keputusan: ${r.id} kolom ${nama} > 300 huruf — pecah jadi beberapa baris`);
    if (/\[ASUMSI\]/i.test(r.sumber))
      galat.push(`03-keputusan: ${r.id} bersumber [ASUMSI] — asumsi tempatnya di 01-konteks (R4)`);
  }
  const butir = butirModul(root, m);
  const p = bacaPersetujuan(root, m);
  const tugas = bacaTugas(root, m);
  const kunci = tesTerkunci(root, m);
  const nos = new Set(tugas.map((t) => t.no));
  if (tugasAktif(tugas).length > 1)
    galat.push(
      `lebih dari 1 tugas aktif: #${tugasAktif(tugas)
        .map((t) => t.no)
        .join(', #')}`,
    );
  for (const t of tugas) {
    const nama = `tugas ${t.no}`;
    const n = t.teks.split('\n').length;
    if (n > BATAS_BARIS.tugas) galat.push(`${nama}: ${n} baris (batas ${BATAS_BARIS.tugas})`);
    if (!STATUS.includes(t.status)) galat.push(`${nama}: status "${t.status}" tidak dikenal`);
    if (!t.butir.length) galat.push(`${nama}: butir kosong`);
    if (!t.file.length && t.status !== 'batal') galat.push(`${nama}: file kosong`);
    if (!t.tes.length && t.status !== 'batal') galat.push(`${nama}: tes kosong (P5: setiap tugas punya test)`);
    for (const id of t.butir) if (!butir.has(id)) galat.push(`${nama}: butir ${id} tidak ada`);
    for (const b of t.bergantung) if (!nos.has(b)) galat.push(`${nama}: bergantung pada tugas ${b} yang tidak ada`);
    if (['siap', 'kerja', 'selesai', 'perbaikan'].includes(t.status)) {
      if (!/```/.test(bagian(t.teks, 'Bukti RED') || '')) galat.push(`${nama}: Bukti RED kosong (R12)`);
      const isiTes = t.tes.map((f) => read(join(root, f)) || '').join('\n');
      for (const id of t.butir.filter((x) => /^K\d+$/.test(x)))
        if (!isiTes.includes(`[${id}]`)) galat.push(`${nama}: tidak ada test bernama [${id}] di file tes`);
      if (!t.tes.every((f) => kunci.has(f)))
        galat.push(`${nama}: status ${t.status} tetapi test belum dikunci (kunci-tes)`);
    }
    if (t.status === 'selesai' && !rapikan(bagian(t.teks, 'Hasil') || '').replace(/^\(.*\)$/, ''))
      galat.push(`${nama}: selesai tetapi bagian Hasil kosong (R11)`);
  }
  for (const [f, { no, hash }] of kunci) {
    const now = hashFile(join(root, f));
    if (now !== hash) galat.push(`test terkunci tugas ${no} berubah/hilang: ${f}`);
  }
  for (const r of kep)
    if (
      statusButir(r.id, butir, p) === 'sah' &&
      !/^BATAL:/i.test(rapikan(r.maka)) &&
      !tugas.some((t) => t.butir.includes(r.id))
    )
      peringatan.push(`${r.id} sudah disetujui tetapi belum dipakai tugas mana pun`);
  return { galat, peringatan };
}

// ── Tahap modul (index.mjs & /modul) ─────────────────────────────────────────
export function tahapModul(root, m) {
  if (!isV2(root, m)) return { tahap: 'v1 (arsip)', berikut: '–' };
  const d = moduleDir(root, m);
  const n = m.slice(0, 3);
  const ada = (k) => existsSync(join(d, DOK[k]));
  const butir = butirModul(root, m);
  const p = bacaPersetujuan(root, m);
  const st = (id) => statusButir(id, butir, p);
  const K = [...butir.values()].filter((b) => b.jenis === 'keputusan');
  const tugas = bacaTugas(root, m).filter((t) => t.status !== 'batal');
  const r = (tahap, berikut) => ({ tahap, berikut });
  const menunggu = (id) => ['belum', 'berubah'].includes(st(id));
  // plan → BRD (00, 01, 03). Mengetik /modul prd = menyetujui K yang terisi.
  if (!ada('konteks') || !K.length || !K.some((b) => st(b.id) !== 'tunda')) return r('plan', `/modul plan ${n}`);
  if (!ada('rancangan') || !tugas.length) return r('prd', `/modul prd ${n}`);
  // Mengetik /modul build = menyetujui K, DATA, KONTRAK yang terisi.
  const dipakai = [...new Set(tugas.flatMap((t) => t.butir))];
  if (dipakai.some((id) => ['tunda', 'tidak-ada'].includes(st(id)))) return r('plan', `/modul plan ${n}`);
  if (dipakai.some(menunggu)) return r('build', `/modul build ${n}`);
  if (tugas.some((t) => ['rancang', 'tes', 'siap', 'kerja', 'blokir'].includes(t.status)))
    return r('build', `/modul build ${n}`);
  if (tugas.some((t) => t.status === 'perbaikan') || !reviewState(root, m).ok) return r('review', `/modul review ${n}`);
  if (!ada('uat') || st('UAT') !== 'sah')
    return r('uat', ada('uat') ? `node scripts/modul/setujui.mjs ${n}` : `/modul uat ${n}`);
  if (!ada('rilis') || st('RILIS') !== 'sah')
    return r('rilis', ada('rilis') ? `node scripts/modul/setujui.mjs ${n}` : `/modul rilis ${n}`);
  return r('selesai', '–');
}

// ── Penolakan setujui di luar terminal pemilik ───────────────────────────────
/** Alasan menolak `setujui` (null = boleh). */
export function penolakanSetujui(env, inTTY, outTTY) {
  if (env.CLAUDECODE || env.OPENCODE || env.CI)
    return 'dijalankan dari tool AI / CI. Jalankan sendiri di terminal Anda.';
  if (!inTTY || !outTTY) return 'bukan terminal interaktif. Jalankan sendiri di terminal Anda.';
  return null;
}

// ── Persetujuan lewat ketikan pemilik (/modul prd, /modul build) ─────────────
/**
 * Mengurai perintah yang DIKETIK pemilik: "/modul prd 002" | "/modul build 002 1-10".
 * null bila bukan perintah persetujuan.
 */
export function parsePerintahSetuju(teks) {
  const m = /^\s*\/modul\s+(prd|build)\s+(\d{1,3}(?:-[a-z0-9-]+)?)\b/.exec(teks || '');
  return m ? { aksi: m[1], ref: m[2] } : null;
}
/**
 * Mengetik /modul prd  = menyetujui semua baris keputusan (K) yang sudah terisi.
 * Mengetik /modul build = menyetujui semua butir K, DATA, KONTRAK yang sudah terisi.
 * Butir ⏳ tidak pernah disetujui. Mengembalikan daftar ID yang disetujui.
 */
export function setujuiLewatKetik(root, m, aksi, oleh) {
  const ids = butirMenunggu(root, m)
    .filter((b) => (aksi === 'prd' ? b.jenis === 'keputusan' : b.jenis !== 'dokumen'))
    .map((b) => b.id);
  for (const id of ids) catatPersetujuan(root, m, id, oleh);
  return ids;
}

/** "3" | "1-10" | "1,3,5-7" → [1,3,5,6,7]; kosong → null (semua). */
export function parseRentang(teks) {
  if (!teks || !rapikan(teks)) return null;
  const out = new Set();
  for (const bag of teks
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)) {
    const r = /^(\d+)(?:-(\d+))?$/.exec(bag);
    if (!r) throw new Error(`rentang tugas tidak dikenal: "${bag}" (contoh: 3 · 1-10 · 1,3,5-7)`);
    const a = Number(r[1]);
    const b = Number(r[2] ?? r[1]);
    for (let i = Math.min(a, b); i <= Math.max(a, b); i++) out.add(i);
  }
  return [...out].sort((x, y) => x - y);
}
