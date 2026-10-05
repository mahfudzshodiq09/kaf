// Persetujuan lewat ketikan pemilik: hook UserPromptExpansion + penjaga agar AI tidak bisa "mengetik" sendiri.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { repoBaru, modulLatihan, jalankan, REPO, M } from './bantu.mjs';
import { bacaPersetujuan, periksaBash } from '../lib.mjs';

const hook = (file, root, payload) =>
  spawnSync(process.execPath, [join(REPO, '.claude/hooks', file)], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: root },
  });

test('UserPromptExpansion "/modul prd 900" menyetujui K terisi (berbagai bentuk input)', () => {
  for (const payload of [
    { hook_event_name: 'UserPromptExpansion', prompt: '/modul prd 900' },
    { hook_event_name: 'UserPromptExpansion', command_name: 'modul', arguments: 'prd 900' },
    { hook_event_name: 'UserPromptExpansion', command: '/modul', args: ['prd', '900'] },
  ]) {
    const r = repoBaru();
    modulLatihan(r);
    const h = hook('setujui-ketik.mjs', r.root, payload);
    assert.equal(h.status, 0, h.stderr);
    assert.match(
      JSON.parse(h.stdout).hookSpecificOutput.additionalContext,
      /disetujui: K1, K2 · masih ⏳ \(tidak disetujui\): K3/,
    );
    assert.deepEqual(Object.keys(bacaPersetujuan(r.root, M)).sort(), ['K1', 'K2']);
  }
});

test('"/modul build 900 1-2" menyetujui DATA & KONTRAK; perintah lain & UserPromptSubmit tidak menyetujui apa pun', () => {
  const r = repoBaru();
  modulLatihan(r);
  assert.equal(
    hook('setujui-ketik.mjs', r.root, { hook_event_name: 'UserPromptSubmit', prompt: '/modul build 900' }).stdout,
    '',
  );
  assert.equal(
    hook('setujui-ketik.mjs', r.root, { hook_event_name: 'UserPromptExpansion', prompt: '/modul review 900' }).stdout,
    '',
  );
  assert.deepEqual(bacaPersetujuan(r.root, M), {});
  hook('setujui-ketik.mjs', r.root, { hook_event_name: 'UserPromptExpansion', prompt: '/modul build 900 1-2' });
  assert.deepEqual(Object.keys(bacaPersetujuan(r.root, M)).sort(), ['DATA', 'K1', 'K2', 'KONTRAK']);
  const salah = hook('setujui-ketik.mjs', r.root, { hook_event_name: 'UserPromptExpansion', prompt: '/modul prd 777' });
  assert.match(salah.stdout, /tidak ditemukan/);
});

test('AI tidak bisa "mengetik" sendiri: tool Skill/SlashCommand & claude -p ditolak', () => {
  const r = repoBaru();
  modulLatihan(r);
  for (const [tool_name, tool_input] of [
    ['SlashCommand', { command: '/modul build 900' }],
    ['Skill', { skill: 'modul', args: 'prd 900' }],
  ]) {
    const h = hook('gate-modul.mjs', r.root, { tool_name, tool_input });
    assert.equal(h.status, 2, tool_name);
    assert.match(h.stderr, /hanya boleh DIKETIK pemilik/);
  }
  assert.equal(
    hook('gate-modul.mjs', r.root, { tool_name: 'SlashCommand', tool_input: { command: '/modul review 900' } }).status,
    0,
  );
  assert.match(periksaBash(r.root, 'claude -p "/modul build 900"') || '', /diketik pemilik/);
  assert.equal(periksaBash(r.root, 'opencode run --agent pembangun "Mode otomatis. Kerjakan tugas 1 modul 900"'), null);
  assert.match(periksaBash(r.root, 'node ~/Documents/nextjs/kaf/bin/kaf.mjs update .') || '', /hanya oleh pemilik/);
  assert.equal(periksaBash(r.root, 'node ../kaf/bin/kaf.mjs cek .'), null, 'cek hanya membaca');
});

test('rencana.mjs: rentang, status, dependensi, belum sah', () => {
  const r = repoBaru();
  modulLatihan(r);
  r.tulis(
    `PLAN/${M}/tugas/02-tabel.md`,
    r.baca(`PLAN/${M}/tugas/02-tabel.md`).replace('bergantung: ', 'bergantung: 1'),
  );
  const o = jalankan(r.root, 'rencana.mjs', ['900', '1-3']);
  assert.equal(o.code, 0, o.out);
  assert.match(o.out, /tidak ada: #3/);
  assert.match(
    o.out,
    /\| 1 \| rancang \| tes→build \| belum sah: K1 belum disetujui; K2 belum disetujui; KONTRAK belum disetujui \|/,
  );
  assert.match(o.out, /\| 2 \| rancang \| tes→build \| belum sah: DATA belum disetujui · menunggu #1 \|/);
  assert.equal(jalankan(r.root, 'rencana.mjs', ['900', 'x']).code, 1);
});
