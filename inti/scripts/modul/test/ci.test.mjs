import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { repoBaru, modulLatihan, jalankan, M } from './bantu.mjs';
import { catatPersetujuan, tulisJson, kunciPath, hashFile, setStatusTugas } from '../lib.mjs';

/** Repo dengan main berisi modul yang sudah disetujui + test tugas 1 terkunci, lalu branch feat. */
function dasar() {
  const r = repoBaru('main');
  modulLatihan(r);
  for (const id of ['K1', 'K2', 'DATA', 'KONTRAK']) catatPersetujuan(r.root, M, id, 'Penguji');
  r.tulis('apps/siakad/src/cuti.rules.test.ts', "it('[K1] a')\nit('[K2] b')\n");
  r.tulis(
    `PLAN/${M}/tugas/01-aturan.md`,
    r.baca(`PLAN/${M}/tugas/01-aturan.md`).replace('(diisi Perancang Uji)', '```\nFAIL\n```'),
  );
  tulisJson(kunciPath(r.root, M), {
    1: {
      'apps/siakad/src/cuti.rules.test.ts': hashFile(join(r.root, 'apps/siakad/src/cuti.rules.test.ts')),
    },
  });
  setStatusTugas(join(r.root, `PLAN/${M}/tugas/01-aturan.md`), 'siap');
  r.commit('docs: modul latihan');
  r.g('checkout', '-q', '-b', `feat/${M}`);
  return r;
}
const gate = (r, env = {}) =>
  jalankan(r.root, 'check-gate.mjs', ['main'], {
    env: { GITHUB_HEAD_REF: '', ...env },
  });

test('lulus: commit kode bertrailer, file milik tugas', () => {
  const r = dasar();
  r.tulis('apps/siakad/src/cuti.rules.ts', 'export const a = 1;\n');
  r.tulis('apps/siakad/package.json', '{}\n');
  r.commit('feat(cuti): aturan\n\nTugas: 1');
  const g = gate(r);
  assert.equal(g.code, 0, g.out);
  assert.match(g.out, /lulus/);
});

test('gagal: tanpa trailer, file di luar tugas, tugas tak ada', () => {
  const r = dasar();
  r.tulis('apps/siakad/src/cuti.rules.ts', 'x\n');
  r.commit('feat(cuti): lupa trailer');
  r.tulis('apps/siakad/src/krs.ts', 'x\n');
  r.commit('feat(cuti): nyasar\n\nTugas: 1');
  r.tulis('apps/siakad/src/cuti.rules.ts', 'y\n');
  r.commit('feat(cuti): hantu\n\nTugas: 7');
  const g = gate(r);
  assert.equal(g.code, 1);
  assert.match(g.out, /tanpa trailer "Tugas: N"/);
  assert.match(g.out, /file di luar tugas 1:\n\s+- apps\/siakad\/src\/krs\.ts/);
  assert.match(g.out, /tugas 7 tidak ada/);
});

test('gagal: test terkunci diubah', () => {
  const r = dasar();
  r.tulis('apps/siakad/src/cuti.rules.test.ts', "it('[K1] a')\nit('[K2] b')\nit.skip('dilemahkan')\n");
  r.commit('test(cuti): ubah\n\nTugas: 1');
  const g = gate(r);
  assert.equal(g.code, 1);
  assert.match(g.out, /test terkunci tugas 1 berubah/);
});

test('gagal: butir berubah setelah disetujui (tugas tidak sah di HEAD)', () => {
  const r = dasar();
  r.tulis(`PLAN/${M}/03-keputusan.md`, r.baca(`PLAN/${M}/03-keputusan.md`).replace('"Ada tunggakan"', '"Lunasi"'));
  r.tulis('apps/siakad/src/cuti.rules.ts', 'x\n');
  r.commit('feat(cuti): x\n\nTugas: 1');
  const g = gate(r);
  assert.equal(g.code, 1);
  assert.match(g.out, /tugas 1 tidak sah di HEAD: K2 berubah/);
});

test('file penjaga: gagal tanpa label perawatan-modul, lulus dengan label', () => {
  const r = dasar();
  r.tulis('scripts/modul/lib.mjs', '// diubah\n');
  r.commit('chore: ubah penjaga');
  assert.match(gate(r).out, /tanpa label "perawatan-modul"/);
  assert.equal(gate(r, { PERAWATAN: 'true' }).code, 0);
});

test('branch non-modul: wajib label non-modul', () => {
  const r = repoBaru('main');
  r.g('checkout', '-q', '-b', 'fix/label');
  r.tulis('apps/siakad/src/x.ts', 'x\n');
  r.commit('fix(siakad): label');
  assert.match(gate(r).out, /bukan branch modul/);
  assert.equal(gate(r, { NON_MODUL: 'true' }).code, 0);
});

test('gerbang UAT: tugas belum selesai / review belum dicap → gagal', () => {
  const r = dasar();
  r.tulis(`PLAN/${M}/06-uat.md`, '# UAT\n\n| Kolom | Isi |\n|---|---|\n| Status UAT | 📝 |\n');
  r.commit('docs(900): uat');
  const g = gate(r);
  assert.equal(g.code, 1);
  assert.match(g.out, /UAT belum boleh — tugas belum selesai: #1, #2/);
  assert.match(g.out, /UAT belum boleh — 05-review\.md belum ada/);
});
