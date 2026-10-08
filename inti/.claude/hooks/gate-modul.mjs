#!/usr/bin/env node
// Penjaga /kaf v2 untuk Claude Code (PreToolUse: Edit|Write|MultiEdit|NotebookEdit|Bash).
// Aturan ada di scripts/modul/lib.mjs (periksaFile/periksaBash). Pembangun (bangun.mjs) memakai hook yang sama
// dengan env MODUL_PERAN=pembangun → aturan lebih ketat. Desain: docs/modul-v2/05-gate.md.
import { readFileSync } from 'node:fs';

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0);
}
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const ti = input.tool_input || {};
const tolak = (alasan) => {
  process.stderr.write(
    `[gate-modul] ${alasan}\nJangan mengakali penjaga ini (R7). Jelaskan ke pemilik dan usulkan jalan resmi (docs/modul-v2/05-gate.md).\n`,
  );
  process.exit(2);
};
let lib;
try {
  lib = await import(new URL('../../scripts/modul/lib.mjs', import.meta.url));
} catch (e) {
  // Lib rusak/hilang: tutup rapat untuk edit kode & file penjaga, biarkan yang lain.
  const f = String(ti.file_path || ti.notebook_path || '');
  if (/(^|\/)(apps|packages|scripts\/modul|\.claude\/hooks)\//.test(f))
    tolak(`lib penjaga tidak bisa dimuat (${e.message}).`);
  process.exit(0);
}
try {
  const pembangun = process.env.MODUL_PERAN === 'pembangun';
  if (pembangun && ['Skill', 'SlashCommand', 'Task', 'Agent', 'WebFetch', 'WebSearch'].includes(input.tool_name))
    tolak(`pembangun tidak boleh memakai ${input.tool_name}.`);
  if (['Skill', 'SlashCommand'].includes(input.tool_name)) {
    if (/\b(?:kaf|modul)\b[\s\S]{0,40}\b(prd|build)\b/.test(JSON.stringify(ti)))
      tolak('/kaf prd dan /kaf build sekaligus persetujuan — hanya boleh DIKETIK pemilik, tidak dipanggil AI.');
  } else if (input.tool_name === 'Bash') {
    const a = lib.periksaBash(root, ti.command || '', {
      alat: pembangun ? 'pembangun' : 'claude',
    });
    if (a) tolak(a);
  } else if (['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(input.tool_name)) {
    const f = ti.file_path || ti.notebook_path;
    if (f) {
      const a = lib.periksaFile(root, f);
      if (a) tolak(a);
    }
  }
} catch (e) {
  if (['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(input.tool_name))
    tolak(`penjaga gagal memeriksa (${e.message}).`);
}
process.exit(0);
