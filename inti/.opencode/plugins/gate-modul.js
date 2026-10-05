// Penjaga /modul v2 untuk OpenCode (agent pembangun / DeepSeek). Aturan sama dengan hook Claude Code:
// scripts/modul/lib.mjs (periksaFile/periksaBash). Desain: docs/modul-v2/05-gate.md.
import { periksaFile, periksaBash } from '../../scripts/modul/lib.mjs';

export const GateModul = async ({ directory, worktree }) => {
  const root = worktree || directory;
  return {
    'tool.execute.before': async (input, output) => {
      const a = output?.args || {};
      let alasan = null;
      if (input.tool === 'bash') {
        alasan = periksaBash(root, a.command || '', { alat: 'opencode' });
      } else if (input.tool === 'apply_patch' || input.tool === 'patch') {
        for (const f of jalurPatch(a.patchText || a.patch || '')) {
          alasan = periksaFile(root, f);
          if (alasan) break;
        }
      } else if (['edit', 'write', 'multiedit'].includes(input.tool)) {
        const f = a.filePath || a.path;
        if (f) alasan = periksaFile(root, f);
      }
      if (alasan)
        throw new Error(
          `[gate-modul] ${alasan} — jangan mengakali penjaga (R7); tandai tugas blokir + alasan bila buntu.`,
        );
    },
  };
};

function jalurPatch(teks) {
  return [...String(teks).matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$|^\*\*\* Move to: (.+)$/gm)].map((m) =>
    (m[1] || m[2]).trim(),
  );
}
