import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { repoBaru, modulLatihan, jalankan, salinTemplate, M } from './bantu.mjs';
import { catatPersetujuan, bacaTugas, bacaKunci } from '../lib.mjs';

function siap() {
  const r = repoBaru();
  modulLatihan(r);
  for (const id of ['K1', 'K2', 'DATA', 'KONTRAK']) catatPersetujuan(r.root, M, id, 'Penguji');
  return r;
}
const T1 = `PLAN/${M}/tugas/01-aturan.md`;
const statusT = (r, no) => bacaTugas(r.root, M).find((t) => t.no === no).status;

test('setujui: --lihat boleh tanpa terminal; menyetujui ditolak tanpa terminal / dari tool AI', () => {
  const r = repoBaru();
  modulLatihan(r);
  const lihat = jalankan(r.root, 'setujui.mjs', ['900', '--lihat']);
  assert.equal(lihat.code, 0);
  assert.match(lihat.out, /4 butir menunggu/);
  assert.match(lihat.out, /⏳ K3/);
  const pipa = jalankan(r.root, 'setujui.mjs', ['900'], { input: 'y\ny\ny\ny\n' });
  assert.equal(pipa.code, 1);
  assert.match(pipa.out, /Ditolak: .*(interaktif|tool AI)/);
  const ai = jalankan(r.root, 'setujui.mjs', ['900'], { env: { CLAUDECODE: '1' }, input: 'y\n' });
  assert.match(ai.out, /tool AI/);
  assert.equal(existsSync(join(r.root, `PLAN/${M}/persetujuan.json`)), false, 'tidak ada yang tertulis');
});

test('kunci-tes: butuh status tes, Bukti RED, dan test [K..]; lalu mengunci → siap', () => {
  const r = siap();
  const tes = 'apps/siakad/src/cuti.rules.test.ts';
  assert.match(jalankan(r.root, 'kunci-tes.mjs', ['900', '1']).out, /harus "tes"/);
  assert.equal(jalankan(r.root, 'status.mjs', ['900', '1', 'tes']).code, 0);
  r.tulis(tes, "it('[K1] menunggu', () => {})\n");
  assert.match(jalankan(r.root, 'kunci-tes.mjs', ['900', '1']).out, /Bukti RED/);
  r.tulis(
    T1,
    r
      .baca(T1)
      .replace('(diisi Perancang Uji)', '```\nFAIL [K1] expected menunggu, received Error: BELUM_DIIMPLEMENTASI\n```'),
  );
  assert.match(jalankan(r.root, 'kunci-tes.mjs', ['900', '1']).out, /\[K2\]/);
  r.tulis(tes, "it('[K1] menunggu', () => {})\nit('[K2] ditolak', () => {})\n");
  const ok = jalankan(r.root, 'kunci-tes.mjs', ['900', '1']);
  assert.equal(ok.code, 0, ok.out);
  assert.equal(statusT(r, 1), 'siap');
  assert.ok(bacaKunci(r.root, M)[1][tes]);
  const buka = jalankan(r.root, 'kunci-tes.mjs', ['900', '1', '--buka']);
  assert.match(buka.out, /alasan/);
  assert.equal(jalankan(r.root, 'kunci-tes.mjs', ['900', '1', '--buka', 'test', 'K2', 'salah']).code, 0);
  assert.equal(statusT(r, 1), 'tes');
  assert.equal(bacaKunci(r.root, M)[1], undefined);
});

test('status: transisi, satu aktif, dependensi, kunci, Hasil, commit trailer', () => {
  const r = siap();
  r.tulis(
    `PLAN/${M}/tugas/02-tabel.md`,
    r.baca(`PLAN/${M}/tugas/02-tabel.md`).replace('bergantung: ', 'bergantung: 1'),
  );
  const s = (...a) => jalankan(r.root, 'status.mjs', ['900', ...a]);
  assert.match(s('1', 'kerja').out, /rancang → kerja tidak diizinkan/);
  assert.match(s('1', 'siap').out, /tidak diizinkan|kunci-tes/);
  assert.equal(s('1', 'tes').code, 0);
  assert.match(s('2', 'tes').out, /#1 masih aktif/);
  assert.match(s('1', 'blokir').out, /alasan/);
  // kunci tugas 1 secara langsung, lalu kerja
  r.tulis('apps/siakad/src/cuti.rules.test.ts', "it('[K1] a')\nit('[K2] b')\n");
  r.tulis(T1, r.baca(T1).replace('(diisi Perancang Uji)', '```\nFAIL\n```'));
  assert.equal(jalankan(r.root, 'kunci-tes.mjs', ['900', '1']).code, 0);
  assert.equal(s('1', 'kerja').code, 0);
  assert.match(s('1', 'selesai').out, /Hasil/);
  r.tulis(T1, r.baca(T1).replace('(diisi pembangun)', 'Model: deepseek. Output: 2 passed.'));
  assert.match(s('1', 'selesai').out, /commit bertrailer "Tugas: 1"/);
  r.tulis('apps/siakad/src/cuti.rules.ts', 'export const ajukanCuti = () => "menunggu";\n');
  r.commit('feat(cuti): aturan\n\nTugas: 1');
  assert.equal(s('1', 'selesai').code, 0);
  // tugas 2 bergantung 1 (selesai) tetapi test belum dikunci
  assert.equal(s('2', 'tes').code, 0);
  assert.match(s('2', 'kerja').out, /tidak diizinkan/);
});

test('tanya-model: memanggil 9router, mencatat model penjawab, menandai MODEL BERBEDA', async () => {
  const r = repoBaru();
  salinTemplate(r);
  r.tulis(
    '.claude/modul/model.json',
    JSON.stringify({ model: { gemini: 'gemini-uji', deepseek: 'ISI_NAMA_MODEL_DEEPSEEK' } }),
  );
  r.tulis('bahan.md', 'Pedoman: cuti maksimal 2 semester.');
  let dijawab = 'gemini-uji';
  let diterima;
  const srv = createServer((req, res) => {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => {
      diterima = JSON.parse(b);
      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({
          model: dijawab,
          choices: [{ message: { content: '## Fakta\n| F1 | cuti | bahan.md |' } }],
          usage: { prompt_tokens: 10, completion_tokens: 5 },
        }),
      );
    });
  });
  await new Promise((ok) => srv.listen(0, ok));
  const url = `http://127.0.0.1:${srv.address().port}/v1`;
  const run = (model, keluar) =>
    new Promise((ok) => {
      import('node:child_process').then(({ execFile }) =>
        execFile(
          process.execPath,
          [
            join(process.cwd(), 'scripts/modul/tanya-model.mjs'),
            '--peran',
            'konteks',
            '--model',
            model,
            '--masuk',
            'bahan.md',
            '--keluar',
            keluar,
          ],
          { cwd: r.root, env: { ...process.env, MODUL_ROOT: r.root, MODUL_ROUTER_URL: url } },
          (e, so, se) => ok({ code: e ? e.code : 0, out: so + se }),
        ),
      );
    });
  const a = await run('gemini', 'PLAN/x/_swarm/a.md');
  assert.equal(a.code, 0, a.out);
  const isi = r.baca('PLAN/x/_swarm/a.md');
  assert.match(isi, /diminta=gemini\(gemini-uji\) · dijawab=gemini-uji · token=10\/5/);
  assert.equal(diterima.model, 'gemini-uji');
  assert.match(diterima.messages[0].content, /Penggali Konteks/);
  assert.match(diterima.messages[0].content, /Aturan umum/);
  assert.match(diterima.messages[1].content, /=== FILE: bahan.md ===/);
  dijawab = 'model-gratisan-lain';
  const b = await run('gemini', 'PLAN/x/_swarm/b.md');
  assert.equal(b.code, 3);
  assert.match(r.baca('PLAN/x/_swarm/b.md'), /⚠️ MODEL BERBEDA/);
  const c = await run('deepseek', 'PLAN/x/_swarm/c.md');
  assert.equal(c.code, 2);
  assert.match(c.out, /isi dulu nama model/);
  srv.close();
});

test('baru: nomor berikutnya, lewati 9xx, isi template', () => {
  const r = repoBaru('main');
  salinTemplate(r);
  r.tulis('PLAN/001-sso/x.md', '');
  r.tulis(`PLAN/${M}/00-modul.md`, '');
  const b = jalankan(r.root, 'baru.mjs', ['pengajuan-cuti']);
  assert.equal(b.code, 0, b.out);
  assert.equal(b.out.trim(), '002-pengajuan-cuti');
  assert.match(r.baca('PLAN/002-pengajuan-cuti/00-modul.md'), /\| Modul \| 002-pengajuan-cuti \|/);
  assert.ok(existsSync(join(r.root, 'PLAN/002-pengajuan-cuti/tugas')));
  assert.equal(jalankan(r.root, 'baru.mjs', ['Bukan Slug']).code, 1);
});

test('template keputusan & tugas bisa dibaca parser', async () => {
  const { parseKeputusan, parseFrontmatter } = await import('../lib.mjs');
  const kep = readFileSync(join(process.cwd(), '.claude/modul/template/03-keputusan.md'), 'utf8');
  assert.equal(parseKeputusan(kep)[0].id, 'K1');
  const fm = parseFrontmatter(readFileSync(join(process.cwd(), '.claude/modul/template/tugas.md'), 'utf8'));
  assert.equal(fm.status, 'rancang');
  assert.equal(fm.no, '1');
});
