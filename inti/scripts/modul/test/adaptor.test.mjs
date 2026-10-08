// Hook Claude Code untuk orkestrator & pembangun (bangun.mjs) memakai aturan yang sama (lib.mjs). Diuji lewat antarmuka aslinya.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { repoBaru, modulLatihan, REPO, M } from './bantu.mjs';
import { catatPersetujuan, setStatusTugas } from '../lib.mjs';

function siap() {
  const r = repoBaru();
  modulLatihan(r);
  for (const id of ['K1', 'K2', 'DATA', 'KONTRAK']) catatPersetujuan(r.root, M, id, 'Penguji');
  setStatusTugas(join(r.root, `PLAN/${M}/tugas/01-aturan.md`), 'kerja');
  return r;
}
const hook = (root, payload, env = {}) =>
  spawnSync(process.execPath, [join(REPO, '.claude/hooks/gate-modul.mjs')], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: {
      ...process.env,
      CLAUDE_PROJECT_DIR: root,
      MODUL_PERAWATAN: '',
      ...env,
    },
  });

test('hook Claude Code: exit 2 + alasan saat ditolak, exit 0 saat boleh', () => {
  const r = siap();
  const tolak = hook(r.root, {
    tool_name: 'Edit',
    tool_input: { file_path: join(r.root, 'apps/siakad/src/krs.ts') },
  });
  assert.equal(tolak.status, 2);
  assert.match(tolak.stderr, /\[gate-modul\].*bukan file tugas 1/);
  assert.equal(
    hook(r.root, {
      tool_name: 'Write',
      tool_input: { file_path: join(r.root, 'apps/siakad/src/cuti.rules.ts') },
    }).status,
    0,
  );
  assert.equal(
    hook(r.root, {
      tool_name: 'Bash',
      tool_input: { command: 'pnpm modul:setujui 900' },
    }).status,
    2,
  );
  assert.equal(hook(r.root, { tool_name: 'Bash', tool_input: { command: 'pnpm test' } }).status, 0);
  assert.equal(
    hook(r.root, {
      tool_name: 'Edit',
      tool_input: { file_path: 'scripts/modul/lib.mjs' },
    }).status,
    2,
  );
  assert.equal(
    hook(r.root, { tool_name: 'Edit', tool_input: { file_path: 'scripts/modul/lib.mjs' } }, { MODUL_PERAWATAN: '1' })
      .status,
    0,
  );
  assert.equal(hook(r.root, { tool_name: 'Read', tool_input: { file_path: 'apps/x.ts' } }).status, 0);
});

test('hook mode pembangun (MODUL_PERAN=pembangun): aturan file sama + Bash & alat lebih ketat', () => {
  const r = siap();
  const P = { MODUL_PERAN: 'pembangun' };
  const tugas = {
    tool_name: 'Edit',
    tool_input: { file_path: join(r.root, 'apps/siakad/src/cuti.rules.ts') },
  };
  assert.equal(hook(r.root, tugas, P).status, 0);
  const luar = hook(
    r.root,
    {
      tool_name: 'Edit',
      tool_input: { file_path: join(r.root, 'apps/siakad/src/krs.ts') },
    },
    P,
  );
  assert.equal(luar.status, 2);
  assert.match(luar.stderr, /bukan file tugas 1/);
  const kunci = hook(
    r.root,
    {
      tool_name: 'Bash',
      tool_input: { command: 'node scripts/modul/kunci-tes.mjs 900 1' },
    },
    P,
  );
  assert.equal(kunci.status, 2);
  assert.match(kunci.stderr, /pembangun/);
  assert.equal(
    hook(r.root, {
      tool_name: 'Bash',
      tool_input: { command: 'node scripts/modul/kunci-tes.mjs 900 1' },
    }).status,
    0,
    'orkestrator (Opus) tetap boleh mengunci',
  );
  assert.equal(hook(r.root, { tool_name: 'Skill', tool_input: { skill: 'apa saja' } }, P).status, 2);
  assert.equal(hook(r.root, { tool_name: 'Bash', tool_input: { command: 'pnpm test' } }, P).status, 0);
});

test('bangun.mjs: env ke 9router, tanpa warisan sesi/perawatan, izin Bash sesuai profil', async () => {
  const { envPembangun, argumenClaude, izinBash, pesanTugas } = await import(join(REPO, 'scripts/modul/bangun.mjs'));
  const model = {
    id: 'ds/deepseek-v4-flash',
    baseAnthropic: 'http://localhost:20128',
    kunci: '',
    menit: 9,
  };
  const e = envPembangun(
    {
      PATH: '/bin',
      CLAUDECODE: '1',
      MODUL_PERAWATAN: '1',
      ANTHROPIC_API_KEY: 'sk-x',
      MODUL_ROOT: '/x',
    },
    model,
  );
  assert.equal(e.MODUL_PERAN, 'pembangun');
  assert.equal(e.ANTHROPIC_BASE_URL, 'http://localhost:20128');
  assert.equal(e.ANTHROPIC_MODEL, 'ds/deepseek-v4-flash');
  assert.equal(e.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'ds/deepseek-v4-flash');
  assert.equal(e.CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY, '1');
  assert.equal(e.CLAUDE_CODE_DISABLE_UNKNOWN_MODEL_WINDOW_ENFORCEMENT, '1');
  for (const k of ['CLAUDECODE', 'MODUL_PERAWATAN', 'ANTHROPIC_API_KEY', 'MODUL_ROOT'])
    assert.equal(e[k], undefined, k);

  const r = siap();
  r.tulis('.claude/modul/agen/pembangun.md', '# Pembangun uji');
  r.tulis('pnpm-lock.yaml', '');
  assert.ok(izinBash(r.root).includes('pnpm --filter'));
  r.tulis('.claude/modul/proyek.json', JSON.stringify({ kode: ['src/'], pembangunBash: ['npm run test:unit'] }));
  assert.deepEqual(izinBash(r.root).slice(0, 2), ['npm run test:unit', 'git status']);

  const a = argumenClaude(r.root, model, pesanTugas('900', 2, false));
  const nilai = (f) => a[a.indexOf(f) + 1];
  assert.equal(a[0], '-p');
  assert.match(a[1], /^Mode otomatis\. Kerjakan tugas 2 modul 900/);
  assert.equal(nilai('--model'), 'ds/deepseek-v4-flash');
  assert.equal(nilai('--append-system-prompt'), '# Pembangun uji');
  assert.equal(nilai('--permission-mode'), 'acceptEdits');
  assert.match(nilai('--allowedTools'), /Bash\(npm run test:unit:\*\)/);
  assert.match(nilai('--disallowedTools'), /WebFetch.*Skill/);
  assert.match(pesanTugas('900', 2, true), /^Mode otomatis\. Perbaiki tugas 2 modul 900/);
});
