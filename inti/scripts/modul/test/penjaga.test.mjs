import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { repoBaru, modulLatihan, M } from './bantu.mjs';
import { periksaFile, periksaBash, catatPersetujuan, setStatusTugas, tulisJson, kunciPath, hashFile } from '../lib.mjs';

function siap() {
  const r = repoBaru();
  modulLatihan(r);
  for (const id of ['K1', 'K2', 'DATA', 'KONTRAK']) catatPersetujuan(r.root, M, id, 'Penguji');
  r.commit('docs: modul');
  return r;
}
const T1 = `PLAN/${M}/tugas/01-aturan.md`;
const T2 = `PLAN/${M}/tugas/02-tabel.md`;

test('file penjaga ditolak, kecuali MODUL_PERAWATAN', () => {
  const r = siap();
  for (const f of [
    'scripts/modul/lib.mjs',
    '.claude/hooks/gate-modul.mjs',
    '.claude/settings.json',
    `PLAN/${M}/persetujuan.json`,
    `PLAN/${M}/kunci-tes.json`,
    'opencode.json',
    '.opencode/plugins/gate-modul.js',
  ])
    assert.match(periksaFile(r.root, f, { perawatan: false }) || '', /file penjaga/, f);
  assert.equal(periksaFile(r.root, 'scripts/modul/lib.mjs', { perawatan: true }), null);
});

test('di luar apps/packages bebas; branch non-modul bebas', () => {
  const r = siap();
  assert.equal(periksaFile(r.root, 'docs/catatan.md'), null);
  assert.equal(periksaFile(r.root, `PLAN/${M}/03-keputusan.md`), null);
  const n = repoBaru('fix/label-krs');
  assert.equal(periksaFile(n.root, 'apps/siakad/src/apa.ts'), null);
});

test('modul v1 / tidak ada → ditolak', () => {
  const r = repoBaru('feat/001-lama');
  r.tulis('PLAN/001-lama/01-BRD.md', 'v1');
  assert.match(periksaFile(r.root, 'apps/x.ts') || '', /v1/);
  const k = repoBaru('feat/002-hantu');
  assert.match(periksaFile(k.root, 'apps/x.ts') || '', /tidak ada/);
});

test('harus tepat 1 tugas aktif', () => {
  const r = siap();
  assert.match(periksaFile(r.root, 'apps/siakad/src/cuti.rules.ts') || '', /tepat 1 tugas aktif.*sekarang 0/);
  setStatusTugas(join(r.root, T1), 'kerja');
  setStatusTugas(join(r.root, T2), 'kerja');
  assert.match(periksaFile(r.root, 'apps/siakad/src/cuti.rules.ts') || '', /sekarang 2/);
});

test('tugas aktif yang belum sah → ditolak (hanya karena butirnya)', () => {
  const r = siap();
  setStatusTugas(join(r.root, T1), 'kerja');
  r.tulis(`PLAN/${M}/03-keputusan.md`, r.baca(`PLAN/${M}/03-keputusan.md`).replace('"Ada tunggakan"', '"Lunasi"'));
  assert.match(periksaFile(r.root, 'apps/siakad/src/cuti.rules.ts') || '', /K2 berubah sejak disetujui/);
});

test('status tes: hanya file tes + stub di file:', () => {
  const r = siap();
  setStatusTugas(join(r.root, T1), 'tes');
  assert.equal(periksaFile(r.root, 'apps/siakad/src/cuti.rules.test.ts'), null);
  assert.equal(periksaFile(r.root, 'apps/siakad/src/cuti.rules.ts'), null);
  assert.match(periksaFile(r.root, 'apps/siakad/src/lain.ts') || '', /hanya file tes/);
});

test('status kerja: file tugas & selalu-boleh; test terkunci & file lain ditolak', () => {
  const r = siap();
  r.tulis('apps/siakad/src/cuti.rules.test.ts', "it('[K1] x')\n");
  tulisJson(kunciPath(r.root, M), {
    1: { 'apps/siakad/src/cuti.rules.test.ts': hashFile(join(r.root, 'apps/siakad/src/cuti.rules.test.ts')) },
  });
  setStatusTugas(join(r.root, T1), 'kerja');
  assert.equal(periksaFile(r.root, join(r.root, 'apps/siakad/src/cuti.rules.ts')), null, 'path absolut');
  assert.equal(periksaFile(r.root, 'apps/siakad/package.json'), null);
  assert.match(periksaFile(r.root, 'apps/siakad/src/cuti.rules.test.ts') || '', /test terkunci/);
  assert.match(periksaFile(r.root, 'apps/siakad/src/krs.rules.ts') || '', /bukan file tugas 1/);
  assert.match(periksaFile(r.root, 'packages/db/prisma/schema.prisma') || '', /bukan file tugas 1/);
});

test('Bash: setujui, --no-verify, tulis ke penjaga/kode lain ditolak; baca & redirect aman boleh', () => {
  const r = siap();
  setStatusTugas(join(r.root, T1), 'kerja');
  const b = (c, alat = 'claude') => periksaBash(r.root, c, { alat, perawatan: false });
  assert.match(b('pnpm modul:setujui 900') || '', /pemilik/);
  assert.match(b('node scripts/modul/setujui.mjs 900') || '', /pemilik/);
  assert.equal(b('node scripts/modul/setujui.mjs 900 --lihat'), null, '--lihat hanya membaca');
  assert.match(b('pnpm modul:setujui 900 --lihat && pnpm modul:setujui 900') || '', /pemilik/);
  assert.match(b('git commit --no-verify -m x') || '', /no-verify/);
  assert.match(b(`echo '{}' > PLAN/${M}/persetujuan.json`) || '', /file penjaga/);
  assert.match(b(`sed -i 's/a/b/' scripts/modul/lib.mjs`) || '', /file penjaga/);
  assert.match(b(`cat x | tee apps/siakad/src/krs.rules.ts`) || '', /bukan file tugas/);
  assert.match(b(`node -e "require('fs').writeFileSync('apps/siakad/src/krs.ts','')"`) || '', /bukan file tugas/);
  assert.equal(b('node scripts/modul/cek.mjs 900 2>&1 | tail -5'), null);
  assert.equal(b('cat apps/siakad/src/krs.rules.ts'), null);
  assert.equal(b('pnpm test > /dev/null'), null);
  assert.equal(b(`sed -i 's/a/b/' apps/siakad/src/cuti.rules.ts`), null, 'file tugas aktif boleh');
  assert.equal(b('node scripts/modul/kunci-tes.mjs 900 1'), null, 'Opus boleh mengunci');
  assert.match(b('node scripts/modul/kunci-tes.mjs 900 1', 'opencode') || '', /pembangun/);
  assert.match(b('node scripts/modul/review.mjs 900', 'opencode') || '', /pembangun/);
});

test('proyek.json: folder kode & file selalu-boleh per project (mis. pmb-univet: src/)', () => {
  const r = siap();
  r.tulis('.claude/modul/proyek.json', JSON.stringify({ kode: ['src/', 'prisma/'], selaluBoleh: ['package.json'] }));
  r.tulis(
    `PLAN/${M}/tugas/01-aturan.md`,
    r.baca(`PLAN/${M}/tugas/01-aturan.md`).replace('file: apps/siakad/src/cuti.rules.ts', 'file: src/lib/cuti.ts'),
  );
  setStatusTugas(join(r.root, T1), 'kerja');
  assert.equal(periksaFile(r.root, 'src/lib/cuti.ts'), null);
  assert.equal(periksaFile(r.root, 'package.json'), null);
  assert.match(periksaFile(r.root, 'src/lib/lain.ts') || '', /bukan file tugas 1/);
  assert.match(periksaFile(r.root, 'prisma/schema.prisma') || '', /bukan file tugas 1/);
  assert.equal(periksaFile(r.root, 'apps/apa.ts'), null, 'apps/ bukan folder kode di project ini');
  assert.match(periksaFile(r.root, '.claude/modul/proyek.json', { perawatan: false }) || '', /file penjaga/);
});
