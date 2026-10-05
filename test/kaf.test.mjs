import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { install, update, cek, berkasInti, KAF, VERSI, MANIFEST, gabungClaudeMd } from '../bin/kaf.mjs';

function project(jenis) {
  const t = mkdtempSync(join(tmpdir(), 'kaf-'));
  const tulis = (p, s) => {
    mkdirSync(dirname(join(t, p)), { recursive: true });
    writeFileSync(join(t, p), s);
  };
  tulis('package.json', JSON.stringify({ name: 'contoh', scripts: { dev: 'next dev' } }, null, 2));
  tulis('.claude/settings.json', JSON.stringify({ includeCoAuthoredBy: false }));
  if (jenis === 'monorepo') {
    tulis('pnpm-workspace.yaml', 'packages: [apps/*]\n');
    mkdirSync(join(t, '.github'));
  }
  return { t, baca: (p) => readFileSync(join(t, p), 'utf8'), tulis, ada: (p) => existsSync(join(t, p)) };
}
const json = (s) => JSON.parse(s);

test('install monorepo: inti, benih profil, settings digabung, skrip, CLAUDE.md, manifest', () => {
  const p = project('monorepo');
  const l = install(p.t, { app: 'siakad', tes: false });
  assert.equal(l.profil, 'monorepo-pnpm');
  assert.equal(l.inti, berkasInti(p.t).length);
  assert.ok(p.ada('.github/workflows/modul-gate.yml'));
  assert.ok(
    p.ada('scripts/modul/lib.mjs') &&
      p.ada('.claude/hooks/setujui-ketik.mjs') &&
      p.ada('.opencode/plugins/gate-modul.js'),
  );
  assert.deepEqual(json(p.baca('.claude/modul/proyek.json')).kode, ['apps/', 'packages/']);
  assert.equal(json(p.baca('.claude/modul/proyek.json')).app, 'siakad');
  const s = json(p.baca('.claude/settings.json'));
  assert.equal(s.includeCoAuthoredBy, false, 'pengaturan lama tetap');
  assert.match(s.hooks.PreToolUse[0].matcher, /Skill\|SlashCommand/);
  assert.match(s.hooks.UserPromptExpansion[0].hooks[0].command, /setujui-ketik/);
  assert.equal(json(p.baca('package.json')).scripts['modul:setujui'], 'node scripts/modul/setujui.mjs');
  assert.equal(json(p.baca('package.json')).scripts.dev, 'next dev');
  assert.match(p.baca('CLAUDE.md'), /<!-- kaf:mulai[\s\S]*\/modul \(kaf [\d.]+\)[\s\S]*<!-- kaf:selesai -->/);
  const m = json(p.baca(MANIFEST));
  assert.equal(m.versi, VERSI);
  assert.equal(Object.keys(m.berkas).length, l.inti);
  assert.throws(() => install(p.t, { tes: false }), /sudah terpasang/);
  // settings idempoten
  update(p.t, { tes: false });
  assert.equal(json(p.baca('.claude/settings.json')).hooks.PreToolUse.length, 1);
});

test('install nextjs-npm: tanpa .github → workflow CI tidak dipasang; folder kode src/', () => {
  const p = project('npm');
  const l = install(p.t, { tes: false });
  assert.equal(l.profil, 'nextjs-npm');
  assert.equal(p.ada('.github/workflows/modul-gate.yml'), false);
  assert.deepEqual(json(p.baca('.claude/modul/proyek.json')).kode, ['src/', 'prisma/', 'tests/']);
  assert.match(p.baca('opencode.json'), /npm run test:unit\*/);
});

test('update: timpa yang tidak diubah, lewati yang diubah lokal, jaga benih, hapus berkas usang, --paksa', () => {
  const p = project('monorepo');
  install(p.t, { tes: false });
  // simulasi versi lama: index.mjs "versi lama" yang tercatat di manifest
  const man = json(p.baca(MANIFEST));
  p.tulis('scripts/modul/index.mjs', '// versi lama\n');
  man.berkas['scripts/modul/index.mjs'] = spawnSync('shasum', ['-a', '256'], {
    input: '// versi lama\n',
    encoding: 'utf8',
  }).stdout.split(' ')[0];
  // berkas usang dari versi lama (tidak ada lagi di inti)
  p.tulis('scripts/modul/usang.mjs', 'usang\n');
  man.berkas['scripts/modul/usang.mjs'] = spawnSync('shasum', ['-a', '256'], {
    input: 'usang\n',
    encoding: 'utf8',
  }).stdout.split(' ')[0];
  man.versi = '1.9.0';
  writeFileSync(join(p.t, MANIFEST), JSON.stringify(man));
  // diubah lokal oleh pemilik
  appendFileSync(join(p.t, '.claude/modul/tahap/plan.md'), '\nCatatan lokal.\n');
  // benih milik project
  p.tulis('.claude/modul/proyek.md', '# milikku\n');

  const l = update(p.t, { tes: false });
  assert.equal(l.dari, '1.9.0');
  assert.deepEqual(l.diperbarui, ['scripts/modul/index.mjs']);
  assert.deepEqual(l.dilewati, ['.claude/modul/tahap/plan.md']);
  assert.deepEqual(l.dihapus, ['scripts/modul/usang.mjs']);
  assert.match(p.baca('scripts/modul/index.mjs'), /PLAN\/INDEX\.md/);
  assert.match(p.baca('.claude/modul/tahap/plan.md'), /Catatan lokal/);
  assert.equal(p.baca('.claude/modul/proyek.md'), '# milikku\n');

  const c = cek(p.t);
  assert.equal(c.terbaru, true);
  assert.deepEqual(c.diubah, ['.claude/modul/tahap/plan.md']);

  const l2 = update(p.t, { paksa: true, tes: false });
  assert.deepEqual(l2.diperbarui, ['.claude/modul/tahap/plan.md']);
  assert.deepEqual(cek(p.t).diubah, []);
});

test('CLAUDE.md: blok diganti bila ada penanda; dilewati bila sudah menjelaskan /modul v2', () => {
  const p = project('npm');
  p.tulis('CLAUDE.md', '# X\n\n<!-- kaf:mulai lama -->\nisi lama\n<!-- kaf:selesai -->\n\n## Lain\n');
  assert.equal(gabungClaudeMd(p.t), 'ganti');
  assert.match(p.baca('CLAUDE.md'), /^# X[\s\S]*\(kaf [\d.]+\)[\s\S]*## Lain/);
  assert.doesNotMatch(p.baca('CLAUDE.md'), /isi lama/);
  const q = project('npm');
  q.tulis('CLAUDE.md', 'Workflow **`/modul` v2** sudah dijelaskan.\n');
  assert.equal(gabungClaudeMd(q.t), 'lewati');
});

test('CLI menolak install/update dari tool AI; cek boleh', () => {
  const p = project('npm');
  const run = (args, env = {}) =>
    spawnSync(process.execPath, [join(KAF, 'bin/kaf.mjs'), ...args], {
      encoding: 'utf8',
      env: { ...process.env, CLAUDECODE: '', ...env },
    });
  assert.match(run(['install', p.t, '--tanpa-tes'], { CLAUDECODE: '1' }).stderr, /Ditolak/);
  assert.equal(existsSync(join(p.t, MANIFEST)), false);
  assert.equal(run(['cek', p.t], { CLAUDECODE: '1' }).status, 0);
});

test('install sungguhan menjalankan 38 test /modul di project', () => {
  const p = project('monorepo');
  const l = install(p.t, {});
  assert.equal(l.tes.ok, true, JSON.stringify(l.tes));
  assert.ok(l.tes.total >= 38);
});
