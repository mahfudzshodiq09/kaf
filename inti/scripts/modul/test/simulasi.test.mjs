// Uji kering Fase 3: satu modul latihan dijalankan dari "baru" sampai "selesai" lewat script sungguhan.
// Persetujuan pemilik disimulasikan dengan catatPersetujuan() — fungsi yang sama yang dipanggil setujui.mjs
// setelah pemilik menekan "y" di terminal (setujui.mjs sendiri menolak berjalan tanpa terminal; diuji di skrip.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repoBaru, jalankan, salinTemplate, tugasTeks } from './bantu.mjs';
import { catatPersetujuan, tahapModul, periksaFile, butirMenunggu, setujuiLewatKetik } from '../lib.mjs';

test('siklus lengkap modul latihan: baru → konteks → keputusan → rancang → tes → build → review → UAT → rilis', () => {
  const r = repoBaru('main');
  salinTemplate(r);
  r.commit('chore: template modul');

  // 0 · mulai
  const b = jalankan(r.root, 'baru.mjs', ['latihan-cuti']);
  assert.equal(b.code, 0, b.out);
  const m = b.out.trim();
  assert.equal(m, '001-latihan-cuti');
  r.g('checkout', '-q', '-b', `feat/${m}`);
  const P = (f) => `PLAN/${m}/${f}`;
  const tahap = () => tahapModul(r.root, m);
  const setujui = (...ids) => ids.forEach((id) => catatPersetujuan(r.root, m, id, 'Pemilik'));
  const tahapHarus = (t, pesan) => assert.equal(tahap().tahap, t, pesan);
  tahapHarus('plan');

  // 1 · konteks
  r.tulis(P('01-konteks.md'), '# Konteks\n\n## Fakta\n| F1 | Cuti maks 2 semester | [PERATURAN] Pedoman §5 |\n');
  tahapHarus('plan');

  // 3 · keputusan — K3 masih ⏳ dan tidak dipakai tugas mana pun
  r.tulis(
    P('03-keputusan.md'),
    `# Keputusan\n\n| ID | Kalau | Maka | Sumber | Status |\n|---|---|---|---|---|\n` +
      `| K1 | Mahasiswa mengajukan cuti tanpa tunggakan | Status "menunggu kaprodi" | [PERATURAN] Pedoman §5 | 📝 |\n` +
      `| K2 | Mahasiswa mengajukan cuti dengan tunggakan | Ditolak, pesan "Ada tunggakan SPP" | [PEMILIK] | 📝 |\n` +
      `| K3 | Cuti ke-3 | ⏳ ditolak atau izin dekan? | [KAMPUS] | 📝 |\n`,
  );
  assert.deepEqual(tahap(), { tahap: 'prd', berikut: '/modul prd 001' });
  assert.deepEqual(
    butirMenunggu(r.root, m).map((x) => x.id),
    ['K1', 'K2'],
    'K3 ⏳ tidak bisa disetujui',
  );
  assert.deepEqual(setujuiLewatKetik(r.root, m, 'prd', 'Pemilik'), ['K1', 'K2'], 'pemilik mengetik /modul prd 001');
  tahapHarus('prd', 'K3 ⏳ tidak menahan PRD');

  // 4 · rancang
  r.tulis(
    P('04-rancangan.md'),
    '# Rancangan\n\n## Data\nTidak ada perubahan database.\n\n## Kontrak\n```ts\nexport function ajukanCuti(i: { tunggakan: number }): { status: string };\n```\n\n## Catatan Teknis\n-\n\n## Tugas\n| 1 | Aturan | K1, K2, KONTRAK | – |\n| 2 | Halaman | K1, K2 | 1 |\n',
  );
  r.tulis(
    P('tugas/01-aturan.md'),
    tugasTeks({
      no: 1,
      butir: 'K1, K2, KONTRAK',
      file: 'apps/siakad/src/modules/cuti/cuti.rules.ts',
      tes: 'apps/siakad/src/modules/cuti/cuti.rules.test.ts',
    }),
  );
  r.tulis(
    P('tugas/02-halaman.md'),
    tugasTeks({
      no: 2,
      butir: 'K1, K2',
      file: 'apps/siakad/src/app/cuti/**',
      tes: 'apps/siakad/e2e/cuti.spec.ts',
      bergantung: '1',
    }),
  );
  assert.deepEqual(tahap(), { tahap: 'build', berikut: '/modul build 001' });
  assert.deepEqual(
    setujuiLewatKetik(r.root, m, 'build', 'Pemilik'),
    ['DATA', 'KONTRAK'],
    'pemilik mengetik /modul build 001',
  );
  tahapHarus('build');
  r.commit('docs(001): rancangan');

  // 5 · tes (Opus) — per tugas: status tes → test + stub → Bukti RED → kunci → commit
  const tesTugas = (no, tesPath, stubPath, isiTes) => {
    assert.equal(jalankan(r.root, 'status.mjs', ['001', String(no), 'tes']).code, 0);
    assert.equal(periksaFile(r.root, tesPath), null, 'test boleh ditulis');
    assert.equal(periksaFile(r.root, stubPath), null, 'stub boleh ditulis');
    assert.match(periksaFile(r.root, 'apps/siakad/src/lain.ts') || '', /hanya file tes/);
    r.tulis(tesPath, isiTes);
    r.tulis(stubPath, "export function ajukanCuti() { throw new Error('BELUM_DIIMPLEMENTASI'); }\n");
    const f = P(no === 1 ? 'tugas/01-aturan.md' : 'tugas/02-halaman.md');
    r.tulis(
      f,
      r
        .baca(f)
        .replace(
          '(diisi Perancang Uji)',
          '```\nFAIL [K1] expected "menunggu kaprodi", received Error: BELUM_DIIMPLEMENTASI\nFAIL [K2] expected TunggakanError\n```',
        ),
    );
    const k = jalankan(r.root, 'kunci-tes.mjs', ['001', String(no)]);
    assert.equal(k.code, 0, k.out);
    r.commit(`test(cuti): tugas ${no}\n\nTugas: ${no}`);
  };
  tesTugas(
    1,
    'apps/siakad/src/modules/cuti/cuti.rules.test.ts',
    'apps/siakad/src/modules/cuti/cuti.rules.ts',
    "it('[K1] menunggu kaprodi')\nit('[K2] tunggakan ditolak')\n",
  );
  tesTugas(
    2,
    'apps/siakad/e2e/cuti.spec.ts',
    'apps/siakad/src/app/cuti/page.tsx',
    "test('[K1] ajukan')\ntest('[K2] tolak')\n",
  );
  assert.deepEqual(tahap(), { tahap: 'build', berikut: '/modul build 001' });

  // 6 · build (DeepSeek) — tugas 2 belum boleh sebelum tugas 1 selesai
  assert.match(jalankan(r.root, 'status.mjs', ['001', '2', 'kerja']).out, /bergantung pada tugas #1/);
  const build = (no, file, isi) => {
    assert.equal(jalankan(r.root, 'status.mjs', ['001', String(no), 'kerja']).code, 0);
    assert.match(
      periksaFile(
        r.root,
        no === 1 ? 'apps/siakad/src/modules/cuti/cuti.rules.test.ts' : 'apps/siakad/e2e/cuti.spec.ts',
      ) || '',
      /test terkunci/,
    );
    assert.equal(periksaFile(r.root, file), null);
    r.tulis(file, isi);
    r.commit(`feat(cuti): tugas ${no}\n\nTugas: ${no}`);
    const f = P(no === 1 ? 'tugas/01-aturan.md' : 'tugas/02-halaman.md');
    r.tulis(
      f,
      r
        .baca(f)
        .replace('(diisi pembangun)', 'Model: deepseek-v4-flash · `pnpm test` 2 passed · Tidak dicek: e2e di HP.'),
    );
    const s = jalankan(r.root, 'status.mjs', ['001', String(no), 'selesai']);
    assert.equal(s.code, 0, s.out);
  };
  build(
    1,
    'apps/siakad/src/modules/cuti/cuti.rules.ts',
    "export function ajukanCuti(i) { if (i.tunggakan) throw new Error('Ada tunggakan SPP'); return { status: 'menunggu kaprodi' }; }\n",
  );

  // P2 di tengah build: pemilik mengubah K3 (⏳, tidak dipakai) — tidak menahan tugas 2
  r.tulis(
    P('03-keputusan.md'),
    r.baca(P('03-keputusan.md')).replace('⏳ ditolak atau izin dekan?', 'Butuh izin dekan'),
  );
  assert.deepEqual(
    butirMenunggu(r.root, m).map((x) => x.id),
    ['K3'],
    'K3 terisi → menunggu, tidak menahan tugas lain',
  );
  build(2, 'apps/siakad/src/app/cuti/page.tsx', 'export default function Halaman() { return null; }\n');
  r.commit('docs(001): build selesai');
  tahapHarus('review');

  // 7 · review (Opus) — cap
  r.tulis(P('05-review.md'), r.baca('.claude/modul/template/05-review.md'));
  r.commit('docs(001): review putaran 1');
  const rv = jalankan(r.root, 'review.mjs', ['001']);
  assert.equal(rv.code, 0, rv.out);
  r.commit('docs(001): cap review');
  tahapHarus('uat');

  // 8 · UAT & 9 · rilis
  r.tulis(
    P('06-uat.md'),
    r
      .baca('.claude/modul/template/06-uat.md')
      .replace('| U1 | | | | K1 | ⬜ | |', '| U1 | Mahasiswa | Ajukan cuti | Status menunggu kaprodi | K1 | ✅ | |'),
  );
  assert.deepEqual(tahap(), { tahap: 'uat', berikut: 'node scripts/modul/setujui.mjs 001' });
  setujui('UAT');
  assert.match(r.baca(P('06-uat.md')), /\| Status UAT \| ✅ Disetujui \d{4}-\d{2}-\d{2} \|/);
  r.tulis(P('07-rilis.md'), r.baca('.claude/modul/template/07-rilis.md'));
  setujui('RILIS', 'K3');
  r.commit('docs(001): uat & rilis');
  tahapHarus('selesai');

  // Validasi, indeks, dan gerbang CI pada hasil akhir
  const cek = jalankan(r.root, 'cek.mjs', ['001']);
  assert.equal(cek.code, 0, cek.out);
  const idx = jalankan(r.root, 'index.mjs');
  assert.equal(idx.code, 0, idx.out);
  assert.match(r.baca('PLAN/INDEX.md'), /\| 001-latihan-cuti \| [^|]+ \| Sedang \| selesai \| 7\/7 \| 2\/2 \| ✓ \|/);
  assert.match(
    r.baca('PLAN/KEPUTUSAN.md'),
    /\| 001:K2 \| Mahasiswa mengajukan cuti dengan tunggakan \| Ditolak, pesan "Ada tunggakan SPP" \|/,
  );
  const g = jalankan(r.root, 'check-gate.mjs', ['main'], { env: { GITHUB_HEAD_REF: '' } });
  assert.equal(g.code, 0, g.out);

  // Setelah rilis: kode diubah tanpa review → gerbang UAT di CI menolak
  r.tulis(P('tugas/01-aturan.md'), r.baca(P('tugas/01-aturan.md')).replace('status: selesai', 'status: perbaikan'));
  r.tulis(
    'apps/siakad/src/modules/cuti/cuti.rules.ts',
    'export function ajukanCuti() { return { status: "diubah" }; }\n',
  );
  r.commit('fix(cuti): ubah tanpa review\n\nTugas: 1');
  const g2 = jalankan(r.root, 'check-gate.mjs', ['main'], { env: { GITHUB_HEAD_REF: '' } });
  assert.equal(g2.code, 1);
  assert.match(g2.out, /UAT belum boleh — tugas belum selesai: #1/);
  assert.match(g2.out, /isi file modul berubah sejak review terakhir/);
});
