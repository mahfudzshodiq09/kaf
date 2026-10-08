#!/usr/bin/env node
// Pembangun /kaf: DeepSeek mengerjakan SATU tugas lewat Claude Code headless yang diarahkan ke 9router.
// Penjaga yang sama (hook gate-modul) berlaku; env MODUL_PERAN=pembangun membuat aturannya lebih ketat.
// Pemakaian:
//   node scripts/modul/bangun.mjs <nnn> <no> [--perbaiki]   kerjakan / perbaiki tugas
//   node scripts/modul/bangun.mjs --cek                      cek claude + 9router + nama model
// Konfigurasi: .claude/modul/model.json (router, model.deepseek, kunciEnv, bangunMenit).
// Izin Bash pembangun: .claude/modul/proyek.json → pembangunBash (awalan perintah); kosong = bawaan sesuai lockfile.
/* global fetch, AbortSignal */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { proyek } from './lib.mjs';

const BASH_PNPM = [
  'pnpm lint',
  'pnpm typecheck',
  'pnpm test',
  'pnpm e2e',
  'pnpm build',
  'pnpm format',
  'pnpm --filter',
];
const BASH_NPM = [
  'npm run lint',
  'npx tsc --noEmit',
  'npm run test',
  'npm run build',
  'npx vitest run',
  'npx playwright test',
];
const BASH_TETAP = [
  'git status',
  'git diff',
  'git log',
  'git show',
  'git add',
  'git commit',
  'node scripts/modul/status.mjs',
  'node scripts/modul/cek.mjs',
  'node scripts/modul/rencana.mjs',
  'ls',
  'pwd',
];
const ALAT_DILARANG = ['WebFetch', 'WebSearch', 'Task', 'Agent', 'Skill', 'SlashCommand', 'NotebookEdit'];

export function bacaModel(root) {
  const f = join(root, '.claude/modul/model.json');
  if (!existsSync(f)) throw new Error(`${f} tidak ada.`);
  const cfg = JSON.parse(readFileSync(f, 'utf8'));
  const id = cfg.model?.deepseek;
  if (!id) throw new Error('model.deepseek belum ada di .claude/modul/model.json.');
  if (/^ISI_/.test(id)) throw new Error('isi dulu nama model deepseek di .claude/modul/model.json.');
  const router = (process.env.MODUL_ROUTER_URL || cfg.router || 'http://localhost:20128/v1').replace(/\/+$/, '');
  return {
    id,
    router,
    // Claude Code menambahkan /v1/messages sendiri.
    baseAnthropic: router.replace(/\/v1$/, ''),
    kunci: process.env.MODUL_ROUTER_KEY || (cfg.kunciEnv ? process.env[cfg.kunciEnv] : '') || '',
    menit: cfg.bangunMenit || 9,
  };
}

export function izinBash(root) {
  const p = proyek(root);
  const daftar = p.pembangunBash?.length
    ? p.pembangunBash
    : existsSync(join(root, 'pnpm-lock.yaml')) || existsSync(join(root, 'pnpm-workspace.yaml'))
      ? BASH_PNPM
      : BASH_NPM;
  return [...daftar, ...BASH_TETAP];
}

export function envPembangun(env, model) {
  const e = { ...env };
  // Jangan mewarisi sesi/izin induk.
  for (const k of [
    'CLAUDECODE',
    'CLAUDE_CODE_ENTRYPOINT',
    'CLAUDE_CODE_SSE_PORT',
    'ANTHROPIC_API_KEY',
    'MODUL_PERAWATAN',
    'MODUL_ROOT',
  ])
    delete e[k];
  Object.assign(e, {
    MODUL_PERAN: 'pembangun',
    ANTHROPIC_BASE_URL: model.baseAnthropic,
    ANTHROPIC_AUTH_TOKEN: model.kunci || '9router',
    ANTHROPIC_MODEL: model.id,
    ANTHROPIC_DEFAULT_OPUS_MODEL: model.id,
    ANTHROPIC_DEFAULT_SONNET_MODEL: model.id,
    ANTHROPIC_DEFAULT_HAIKU_MODEL: model.id,
    ANTHROPIC_SMALL_FAST_MODEL: model.id,
    CLAUDE_CODE_SUBAGENT_MODEL: model.id,
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
    // Nama model 9router (mis. ds/deepseek-v4-flash) tidak ada di katalog Claude Code:
    // ambil daftar model dari 9router, dan biarkan 9router yang menentukan diterima/tidak.
    CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY: '1',
    CLAUDE_CODE_DISABLE_UNKNOWN_MODEL_WINDOW_ENFORCEMENT: '1',
  });
  return e;
}

export function pesanTugas(nnn, no, perbaiki) {
  return perbaiki
    ? `Mode otomatis. Perbaiki tugas ${no} modul ${nnn}: temuannya ada di PLAN/<modul>/05-review.md (putaran terakhir). Test terkunci — perbaiki kodenya saja, lalu selesaikan sesuai prosedurmu.`
    : `Mode otomatis. Kerjakan tugas ${no} modul ${nnn} sesuai prosedurmu. Tidak ada pemilik yang menjawab: bila kurang jelas, jangan menebak — tandai blokir dengan pertanyaan pilihan ganda di alasannya.`;
}

export function argumenClaude(root, model, pesan) {
  const prompt = readFileSync(join(root, '.claude/modul/agen/pembangun.md'), 'utf8');
  const izin = [
    'Read',
    'Glob',
    'Grep',
    'Edit',
    'Write',
    'MultiEdit',
    'TodoWrite',
    ...izinBash(root).map((p) => `Bash(${p}:*)`),
  ];
  return [
    '-p',
    pesan,
    '--model',
    model.id,
    '--append-system-prompt',
    prompt,
    '--permission-mode',
    'acceptEdits',
    '--allowedTools',
    izin.join(','),
    '--disallowedTools',
    ALAT_DILARANG.join(','),
    '--max-turns',
    '80',
    '--output-format',
    'text',
  ];
}

const kepala2 = (model) => ({
  'content-type': 'application/json',
  'anthropic-version': '2023-06-01',
  'x-api-key': model.kunci || '9router',
  authorization: `Bearer ${model.kunci || '9router'}`,
});

const isiUji = (model, stream) =>
  JSON.stringify({
    model: model.id,
    max_tokens: 16,
    stream,
    messages: [{ role: 'user', content: 'Balas hanya dengan satu kata: OK' }],
  });

const ekor = (s, n = 40) => (s || '').trim().split('\n').slice(-n).join('\n');

async function cek(root) {
  let ok = true;
  const baris = (lulus, teks) => {
    ok &&= lulus;
    console.log(`${lulus ? '✅' : '❌'} ${teks}`);
  };
  const v = spawnSync('claude', ['--version'], { encoding: 'utf8' });
  baris(v.status === 0, `claude ${v.status === 0 ? v.stdout.trim() : 'tidak ditemukan di PATH'}`);
  let model;
  try {
    model = bacaModel(root);
    baris(true, `model pembangun: ${model.id}`);
  } catch (e) {
    baris(false, e.message);
  }
  if (model) {
    try {
      const r = await fetch(`${model.router}/models`, {
        headers: model.kunci ? { Authorization: `Bearer ${model.kunci}` } : {},
        signal: AbortSignal.timeout(5000),
      });
      baris(r.status < 500, `9router ${model.router} (HTTP ${r.status})`);
    } catch (e) {
      baris(false, `9router ${model.router} tidak menjawab (${e.cause?.code || e.message}) — nyalakan 9router.`);
    }
  }
  if (ok) {
    // Uji langsung format Anthropic (/v1/messages) di 9router — yang dipakai Claude Code.
    try {
      const r = await fetch(`${model.baseAnthropic}/v1/messages`, {
        method: 'POST',
        headers: kepala2(model),
        body: isiUji(model, false),
        signal: AbortSignal.timeout(60000),
      });
      const t = await r.text();
      baris(
        r.ok && /"type"\s*:\s*"message"/.test(t),
        `9router format Anthropic (HTTP ${r.status}): ${t.slice(0, 300)}`,
      );
    } catch (e) {
      baris(false, `9router format Anthropic tidak menjawab dalam 60 dtk (${e.cause?.code || e.name})`);
    }
  }
  if (ok) {
    try {
      const r = await fetch(`${model.baseAnthropic}/v1/messages`, {
        method: 'POST',
        headers: kepala2(model),
        body: isiUji(model, true),
        signal: AbortSignal.timeout(60000),
      });
      const t = await r.text();
      baris(
        r.ok && /message_start/.test(t) && /message_stop/.test(t),
        `9router format Anthropic streaming (HTTP ${r.status})${r.ok && /message_stop/.test(t) ? '' : ': ' + t.slice(0, 300)}`,
      );
    } catch (e) {
      baris(false, `9router streaming tidak selesai dalam 60 dtk (${e.cause?.code || e.name})`);
    }
  }
  if (ok) {
    const r = spawnSync('claude', ['-p', 'Balas hanya dengan satu kata: OK', '--model', model.id, '--max-turns', '1'], {
      cwd: root,
      encoding: 'utf8',
      env: envPembangun(process.env, model),
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 180000,
    });
    const jawab = (r.stdout || '').trim();
    baris(
      r.status === 0 && /\bOK\b/i.test(jawab),
      `uji panggil DeepSeek lewat Claude Code (exit ${r.status ?? r.error?.code}): ${ekor([jawab, r.stderr, r.error?.message].filter(Boolean).join('\n') || 'tanpa output', 8)}`,
    );
  }
  console.log(ok ? 'Pembangun siap.' : 'Pembangun BELUM siap. Perbaiki yang ❌, atau pakai /kaf build … --opus.');
  return ok ? 0 : 1;
}

function bangun(root, nnn, no, perbaiki) {
  const model = bacaModel(root);
  const r = spawnSync('claude', argumenClaude(root, model, pesanTugas(nnn, no, perbaiki)), {
    cwd: root,
    encoding: 'utf8',
    env: envPembangun(process.env, model),
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: model.menit * 60000,
    maxBuffer: 64 * 1024 * 1024,
  });
  console.log(ekor(r.stdout));
  if (r.error?.code === 'ETIMEDOUT') {
    console.error(`[bangun] pembangun terhenti setelah ${model.menit} menit.`);
    return 3;
  }
  if (r.error) {
    console.error(`[bangun] gagal menjalankan claude: ${r.error.message}`);
    return 2;
  }
  if (r.status !== 0) console.error(`[bangun] claude keluar dengan kode ${r.status}\n${ekor(r.stderr, 15)}`);
  return r.status ?? 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const root = process.env.MODUL_ROOT || process.cwd();
  const a = process.argv.slice(2);
  if (a.includes('--cek')) process.exit(await cek(root));
  const [nnn, no] = a.filter((x) => !x.startsWith('--'));
  if (!/^\d{1,3}$/.test(nnn || '') || !/^\d+$/.test(no || '')) {
    console.error('pemakaian: node scripts/modul/bangun.mjs <nnn> <no> [--perbaiki] | --cek');
    process.exit(1);
  }
  try {
    process.exit(bangun(root, nnn, no, a.includes('--perbaiki')));
  } catch (e) {
    console.error(`[bangun] ${e.message}`);
    process.exit(2);
  }
}
