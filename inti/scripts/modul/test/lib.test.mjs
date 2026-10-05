import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repoBaru, modulLatihan, M } from './bantu.mjs';
import {
  parseKeputusan,
  hashKeputusan,
  butirModul,
  bacaPersetujuan,
  statusButir,
  catatPersetujuan,
  cekTugas,
  bacaTugas,
  globToRegex,
  matchesAny,
  butirMenunggu,
  penolakanSetujui,
  periksaModul,
  tahapModul,
  parseRentang,
  parsePerintahSetuju,
  setujuiLewatKetik,
} from '../lib.mjs';

test('hash keputusan: Status & Sumber tidak memengaruhi, Maka memengaruhi', () => {
  const [a] = parseKeputusan('| K1 | Kalau x | Maka y | [PEMILIK] | 📝 |');
  const [b] = parseKeputusan('| K1 |  Kalau   x | Maka y | [PERATURAN] §2 | ✅ 2026-10-05 |');
  const [c] = parseKeputusan('| K1 | Kalau x | Maka z | [PEMILIK] | 📝 |');
  assert.equal(hashKeputusan(a), hashKeputusan(b));
  assert.notEqual(hashKeputusan(a), hashKeputusan(c));
});

test('status butir: belum → sah → berubah; ⏳ = tunda dan tidak bisa disetujui', () => {
  const r = repoBaru();
  modulLatihan(r);
  const st = (id) => statusButir(id, butirModul(r.root, M), bacaPersetujuan(r.root, M));
  assert.equal(st('K1'), 'belum');
  assert.equal(st('K3'), 'tunda');
  assert.equal(st('K9'), 'tidak-ada');
  catatPersetujuan(r.root, M, 'K1', 'Penguji');
  assert.equal(st('K1'), 'sah');
  assert.match(r.baca(`PLAN/${M}/03-keputusan.md`), /\| K1 \|.*\| ✅ \d{4}-\d{2}-\d{2} \|/);
  // mengubah Status/Sumber tidak membatalkan
  r.tulis(
    `PLAN/${M}/03-keputusan.md`,
    r.baca(`PLAN/${M}/03-keputusan.md`).replace('[PERATURAN] Pedoman §5', '[PERATURAN] Pedoman §5.1'),
  );
  assert.equal(st('K1'), 'sah');
  // mengubah Maka membatalkan
  r.tulis(`PLAN/${M}/03-keputusan.md`, r.baca(`PLAN/${M}/03-keputusan.md`).replace('"menunggu"', '"diajukan"'));
  assert.equal(st('K1'), 'berubah');
  assert.throws(() => catatPersetujuan(r.root, M, 'K3', 'Penguji'), /⏳/);
});

test('P2: mengubah satu butir hanya menahan tugas yang memakainya', () => {
  const r = repoBaru();
  modulLatihan(r);
  for (const id of ['K1', 'K2', 'DATA', 'KONTRAK']) catatPersetujuan(r.root, M, id, 'Penguji');
  const [t1, t2] = bacaTugas(r.root, M);
  assert.equal(cekTugas(r.root, M, t1).ok, true);
  assert.equal(cekTugas(r.root, M, t2).ok, true);
  r.tulis(`PLAN/${M}/03-keputusan.md`, r.baca(`PLAN/${M}/03-keputusan.md`).replace('"Ada tunggakan"', '"Lunasi dulu"'));
  const c1 = cekTugas(r.root, M, t1);
  assert.equal(c1.ok, false);
  assert.deepEqual(c1.alasan, ['K2 berubah sejak disetujui']);
  assert.equal(cekTugas(r.root, M, t2).ok, true);
  // Catatan Teknis tidak di-hash
  r.tulis(`PLAN/${M}/04-rancangan.md`, r.baca(`PLAN/${M}/04-rancangan.md`).replace('Bebas diubah.', 'Sudah diubah.'));
  assert.equal(cekTugas(r.root, M, t2).ok, true);
  assert.deepEqual(
    butirMenunggu(r.root, M).map((b) => b.id),
    ['K2'],
  );
});

test('glob', () => {
  assert.ok(globToRegex('apps/*/package.json').test('apps/siakad/package.json'));
  assert.ok(!globToRegex('apps/*/package.json').test('apps/siakad/src/package.json'));
  assert.ok(matchesAny('packages/db/prisma/migrations/1/x.sql', ['packages/db/prisma/**']));
  assert.ok(matchesAny('PLAN/002-x/persetujuan.json', ['PLAN/*/persetujuan.json']));
});

test('setujui ditolak di luar terminal pemilik', () => {
  assert.match(penolakanSetujui({ CLAUDECODE: '1' }, true, true), /tool AI/);
  assert.match(penolakanSetujui({ OPENCODE: '1' }, true, true), /tool AI/);
  assert.match(penolakanSetujui({ CI: 'true' }, true, true), /tool AI/);
  assert.match(penolakanSetujui({}, false, true), /interaktif/);
  assert.equal(penolakanSetujui({}, true, true), null);
});

test('periksaModul: batas ukuran, [ASUMSI], ID ganda, butir tak dikenal', () => {
  const r = repoBaru();
  modulLatihan(r);
  r.tulis(`PLAN/${M}/04-rancangan.md`, r.baca(`PLAN/${M}/04-rancangan.md`) + 'x\n'.repeat(400));
  r.tulis(
    `PLAN/${M}/03-keputusan.md`,
    r.baca(`PLAN/${M}/03-keputusan.md`) + '| K2 | dobel | y | [PEMILIK] | |\n| K4 | a | b | [ASUMSI] | |\n',
  );
  r.tulis(
    `PLAN/${M}/tugas/03-x.md`,
    '---\nno: 3\njudul: x\nbutir: K99\nfile: apps/a.ts\ntes: apps/a.test.ts\nstatus: rancang\n---\n',
  );
  const { galat } = periksaModul(r.root, M);
  const teks = galat.join('\n');
  assert.match(teks, /04-rancangan\.md: \d+ baris \(batas 400\)/);
  assert.match(teks, /ID K2 dipakai dua kali/);
  assert.match(teks, /K4 bersumber \[ASUMSI\]/);
  assert.match(teks, /tugas 3: butir K99 tidak ada/);
});

test('tahap modul mengikuti persetujuan (perintah plan/prd/build)', () => {
  const r = repoBaru();
  modulLatihan(r);
  assert.deepEqual(
    tahapModul(r.root, M),
    { tahap: 'build', berikut: '/modul build 900' },
    'K1/K2 belum disetujui → ketik build',
  );
  for (const id of ['K1', 'K2']) catatPersetujuan(r.root, M, id, 'Penguji');
  assert.deepEqual(tahapModul(r.root, M), { tahap: 'build', berikut: '/modul build 900' }, 'DATA/KONTRAK menunggu');
  for (const id of ['DATA', 'KONTRAK']) catatPersetujuan(r.root, M, id, 'Penguji');
  assert.deepEqual(
    tahapModul(r.root, M),
    { tahap: 'build', berikut: '/modul build 900' },
    'tugas rancang → build menulis test dulu',
  );
  r.tulis(
    `PLAN/${M}/tugas/02-tabel.md`,
    r.baca(`PLAN/${M}/tugas/02-tabel.md`).replace('butir: DATA', 'butir: DATA, K3'),
  );
  assert.deepEqual(tahapModul(r.root, M), { tahap: 'plan', berikut: '/modul plan 900' }, 'tugas memakai K3 ⏳');
});

test('parseRentang & parsePerintahSetuju', () => {
  assert.deepEqual(parseRentang('3'), [3]);
  assert.deepEqual(parseRentang('1-4'), [1, 2, 3, 4]);
  assert.deepEqual(parseRentang('5,1-2, 7'), [1, 2, 5, 7]);
  assert.equal(parseRentang(''), null);
  assert.throws(() => parseRentang('1-a'), /rentang/);
  assert.deepEqual(parsePerintahSetuju('/modul prd 002'), { aksi: 'prd', ref: '002' });
  assert.deepEqual(parsePerintahSetuju('/modul build 2 1-10 --opus'), { aksi: 'build', ref: '2' });
  assert.equal(parsePerintahSetuju('/modul plan "cuti"'), null);
  assert.equal(parsePerintahSetuju('/modul review 002'), null);
  assert.equal(parsePerintahSetuju('tolong /modul prd 002'), null, 'harus di awal ketikan');
});

test('setujuiLewatKetik: prd hanya K terisi; build K + DATA + KONTRAK; ⏳ tidak pernah', () => {
  const r = repoBaru();
  modulLatihan(r);
  assert.deepEqual(setujuiLewatKetik(r.root, M, 'prd', 'Pemilik'), ['K1', 'K2']);
  assert.deepEqual(setujuiLewatKetik(r.root, M, 'prd', 'Pemilik'), [], 'tidak ada yang baru');
  r.tulis(
    `PLAN/${M}/03-keputusan.md`,
    r.baca(`PLAN/${M}/03-keputusan.md`) + '| K4 | Baru saat prd | Diterima | [PEMILIK] | 📝 |\n',
  );
  assert.deepEqual(setujuiLewatKetik(r.root, M, 'build', 'Pemilik'), ['K4', 'DATA', 'KONTRAK']);
  assert.equal(bacaPersetujuan(r.root, M).K3, undefined);
  assert.match(bacaPersetujuan(r.root, M).K1.oleh, /Pemilik/);
});
