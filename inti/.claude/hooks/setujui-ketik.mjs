#!/usr/bin/env node
// Persetujuan lewat ketikan pemilik (hook UserPromptExpansion — hanya terpicu oleh perintah yang DIKETIK manusia).
//   /modul prd <nnn>    → menyetujui semua baris keputusan (K) yang sudah terisi (BRD)
//   /modul build <nnn>  → menyetujui semua K + DATA + KONTRAK yang sudah terisi (PRD)
// Butir ⏳ tidak pernah disetujui. Desain: docs/modul-v2/05-gate.md.
import { readFileSync } from 'node:fs';

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0);
}
// Hanya untuk UserPromptExpansion. UserPromptSubmit juga terpicu oleh giliran otomatis, jadi tidak sah sebagai bukti.
if (input.hook_event_name && input.hook_event_name !== 'UserPromptExpansion') process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const lib = await import(new URL('../../scripts/modul/lib.mjs', import.meta.url));

const kandidat = [];
for (const k of ['prompt', 'raw_prompt', 'user_prompt', 'original_prompt', 'command_text'])
  if (typeof input[k] === 'string') kandidat.push(input[k]);
const nama = input.command_name || input.command || input.name || input.skill_name;
const arg = input.arguments ?? input.args ?? input.command_args ?? '';
if (typeof nama === 'string') kandidat.push(`/${nama.replace(/^\//, '')} ${Array.isArray(arg) ? arg.join(' ') : arg}`);
const cmd = kandidat.map(lib.parsePerintahSetuju).find(Boolean);
if (!cmd) process.exit(0);

const m = lib.findModule(root, cmd.ref);
const keluar = (teks) => {
  process.stdout.write(
    JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptExpansion', additionalContext: teks } }),
  );
  process.exit(0);
};
if (!m || !lib.isV2(root, m)) keluar(`[setujui-ketik] modul "${cmd.ref}" tidak ditemukan / bukan v2 — tidak ada yang disetujui.`);

let oleh = 'pemilik';
try {
  oleh = lib.git(root, ['config', 'user.name']) || oleh;
} catch {
  // git tidak tersedia: tetap "pemilik"
}
const ids = lib.setujuiLewatKetik(root, m, cmd.aksi, `${oleh} (mengetik /modul ${cmd.aksi})`);
const tunda = [...lib.butirModul(root, m).values()].filter((b) => b.tunda).map((b) => b.id);
keluar(
  `[setujui-ketik] Pemilik mengetik /modul ${cmd.aksi} ${m.slice(0, 3)} → disetujui: ${ids.join(', ') || '(tidak ada yang baru)'}` +
    (tunda.length ? ` · masih ⏳ (tidak disetujui): ${tunda.join(', ')}` : '') +
    '. Persetujuan ini dicatat oleh hook, bukan oleh AI — jangan menulis persetujuan sendiri.',
);
