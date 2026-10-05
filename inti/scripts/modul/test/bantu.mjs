// Pembantu test /modul: repo git sementara + modul latihan 900-latihan.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const M = '900-latihan';

export function repoBaru(branch = `feat/${M}`) {
  const root = mkdtempSync(join(tmpdir(), 'modul-'));
  const g = (...a) =>
    execFileSync('git', a, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
      .toString()
      .trim();
  g('init', '-q', '-b', 'main');
  g('config', 'user.email', 'uji@contoh.test');
  g('config', 'user.name', 'Penguji');
  g('config', 'commit.gpgsign', 'false');
  const tulis = (p, s) => {
    const f = join(root, p);
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, s);
  };
  const baca = (p) => readFileSync(join(root, p), 'utf8');
  const commit = (msg) => {
    g('add', '-A');
    g('commit', '-q', '--allow-empty', '-m', msg);
    return g('rev-parse', 'HEAD');
  };
  tulis('README.md', 'uji\n');
  commit('awal');
  if (branch !== 'main') g('checkout', '-q', '-b', branch);
  return { root, g, tulis, baca, commit };
}

/** Jalankan script /modul di repo sementara. */
export function jalankan(root, script, args = [], { env = {}, input } = {}) {
  const r = spawnSync(process.execPath, [join(REPO, 'scripts/modul', script), ...args], {
    cwd: root,
    env: { ...process.env, CLAUDECODE: '', OPENCODE: '', CI: '', ...env, MODUL_ROOT: root },
    input,
    encoding: 'utf8',
  });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

export const KEPUTUSAN = `# Keputusan — ${M}

| ID | Kalau | Maka | Sumber | Status |
|---|---|---|---|---|
| K1 | Mahasiswa mengajukan cuti | Status pengajuan "menunggu" | [PERATURAN] Pedoman §5 | 📝 |
| K2 | Pengajuan cuti saat ada tunggakan | Ditolak dengan pesan "Ada tunggakan" | [PEMILIK] | 📝 |
| K3 | Cuti lebih dari 2 semester | ⏳ ditolak atau butuh izin dekan? | [KAMPUS] | 📝 |
`;
export const RANCANGAN = `# Rancangan — ${M}

## Data
\`\`\`prisma
model Cuti { id Int @id }
\`\`\`

## Kontrak
\`\`\`ts
export function ajukanCuti(adaTunggakan: boolean): 'menunggu';
\`\`\`

## Catatan Teknis
Bebas diubah.

## Tugas
| No | Judul | Butir | Bergantung |
|---|---|---|---|
| 1 | Aturan cuti | K1, K2, KONTRAK | – |
| 2 | Tabel cuti | DATA | – |
`;
export const tugasTeks = ({ no, butir, file, tes, status = 'rancang', bergantung = '' }) => `---
no: ${no}
judul: Tugas ${no}
butir: ${butir}
file: ${file}
tes: ${tes}
bergantung: ${bergantung}
status: ${status}
---
## Tujuan
Latihan.

## Bukti RED
(diisi Perancang Uji)

## Klarifikasi

## Hasil
(diisi pembangun)
`;

/** Modul latihan lengkap sampai tahap rancang (belum ada persetujuan). */
export function modulLatihan(r) {
  r.tulis(`PLAN/${M}/00-modul.md`, `# ${M}\n\n| Kolom | Isi |\n|---|---|\n| App | siakad |\n| Ukuran | Sedang |\n`);
  r.tulis(`PLAN/${M}/01-konteks.md`, '# Konteks\n');
  r.tulis(`PLAN/${M}/03-keputusan.md`, KEPUTUSAN);
  r.tulis(`PLAN/${M}/04-rancangan.md`, RANCANGAN);
  r.tulis(
    `PLAN/${M}/tugas/01-aturan.md`,
    tugasTeks({
      no: 1,
      butir: 'K1, K2, KONTRAK',
      file: 'apps/siakad/src/cuti.rules.ts',
      tes: 'apps/siakad/src/cuti.rules.test.ts',
    }),
  );
  r.tulis(
    `PLAN/${M}/tugas/02-tabel.md`,
    tugasTeks({ no: 2, butir: 'DATA', file: 'packages/db/prisma/**', tes: 'packages/db/src/cuti.int.test.ts' }),
  );
}

export function salinTemplate(r) {
  // proyek.json/proyek.md milik project asli tidak ikut: test memakai struktur default (apps/, packages/).
  cpSync(join(REPO, '.claude/modul'), join(r.root, '.claude/modul'), {
    recursive: true,
    filter: (src) => !/proyek\.(json|md)$/.test(src),
  });
}
