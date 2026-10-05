// Hook Claude Code & plugin OpenCode memakai aturan yang sama (lib.mjs). Diuji lewat antarmuka aslinya.
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
    env: { ...process.env, CLAUDE_PROJECT_DIR: root, MODUL_PERAWATAN: '', ...env },
  });

test('hook Claude Code: exit 2 + alasan saat ditolak, exit 0 saat boleh', () => {
  const r = siap();
  const tolak = hook(r.root, { tool_name: 'Edit', tool_input: { file_path: join(r.root, 'apps/siakad/src/krs.ts') } });
  assert.equal(tolak.status, 2);
  assert.match(tolak.stderr, /\[gate-modul\].*bukan file tugas 1/);
  assert.equal(
    hook(r.root, { tool_name: 'Write', tool_input: { file_path: join(r.root, 'apps/siakad/src/cuti.rules.ts') } })
      .status,
    0,
  );
  assert.equal(hook(r.root, { tool_name: 'Bash', tool_input: { command: 'pnpm modul:setujui 900' } }).status, 2);
  assert.equal(hook(r.root, { tool_name: 'Bash', tool_input: { command: 'pnpm test' } }).status, 0);
  assert.equal(hook(r.root, { tool_name: 'Edit', tool_input: { file_path: 'scripts/modul/lib.mjs' } }).status, 2);
  assert.equal(
    hook(r.root, { tool_name: 'Edit', tool_input: { file_path: 'scripts/modul/lib.mjs' } }, { MODUL_PERAWATAN: '1' })
      .status,
    0,
  );
  assert.equal(hook(r.root, { tool_name: 'Read', tool_input: { file_path: 'apps/x.ts' } }).status, 0);
});

test('plugin OpenCode: melempar error saat ditolak (edit, write, apply_patch, bash)', async () => {
  const r = siap();
  const { GateModul } = await import(join(REPO, '.opencode/plugins/gate-modul.js'));
  const h = (await GateModul({ directory: r.root, worktree: r.root }))['tool.execute.before'];
  await assert.rejects(
    h({ tool: 'edit' }, { args: { filePath: join(r.root, 'apps/siakad/src/krs.ts') } }),
    /bukan file tugas 1/,
  );
  await assert.doesNotReject(
    h({ tool: 'write' }, { args: { filePath: join(r.root, 'apps/siakad/src/cuti.rules.ts') } }),
  );
  await assert.rejects(
    h(
      { tool: 'apply_patch' },
      {
        args: {
          patchText:
            '*** Begin Patch\n*** Update File: apps/siakad/src/cuti.rules.ts\n@@\n*** Add File: apps/siakad/src/lain.ts\n+x\n*** End Patch',
        },
      },
    ),
    /lain\.ts bukan file tugas 1/,
  );
  await assert.rejects(
    h({ tool: 'bash' }, { args: { command: 'node scripts/modul/kunci-tes.mjs 900 1' } }),
    /pembangun/,
  );
  await assert.rejects(
    h({ tool: 'bash' }, { args: { command: `echo x > PLAN/${M}/persetujuan.json` } }),
    /file penjaga/,
  );
  await assert.doesNotReject(h({ tool: 'read' }, { args: { filePath: 'apps/x.ts' } }));
});
