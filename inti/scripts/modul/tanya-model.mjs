#!/usr/bin/env node
// Memanggil Gemini/DeepSeek lewat 9router (OpenAI-compatible) untuk agent non-Opus. Lihat docs/modul-v2/02-agen.md.
// Pemakaian:
//   node scripts/modul/tanya-model.mjs --peran konteks --model gemini \
//     --masuk PLAN/002-cuti/00-modul.md,docs/research/x.md --keluar PLAN/002-cuti/_swarm/konteks-gemini.md [--tugas "teks tambahan"]
// Konfigurasi: .claude/modul/model.json (nama model di 9router). Env: MODUL_ROUTER_URL, MODUL_ROUTER_KEY.
/* global fetch, AbortSignal */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const root = process.env.MODUL_ROOT || process.cwd();
const args = parseArgs(process.argv.slice(2));
const die = (msg, code = 1) => {
  console.error(`[tanya-model] ${msg}`);
  process.exit(code);
};
if (!args.peran || !args.model || !args.keluar)
  die('wajib: --peran <nama> --model <gemini|deepseek> --keluar <file> [--masuk a,b] [--tugas "…"]');

const cfgPath = join(root, '.claude/modul/model.json');
if (!existsSync(cfgPath)) die(`${cfgPath} tidak ada.`);
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
const id = cfg.model?.[args.model];
if (!id) die(`alias model "${args.model}" tidak ada di model.json.`);
if (/^ISI_/.test(id))
  die(`isi dulu nama model "${args.model}" di .claude/modul/model.json (lihat docs/modul-v2/07-pemasangan.md).`, 2);
const base = (process.env.MODUL_ROUTER_URL || cfg.router || 'http://localhost:20128/v1').replace(/\/$/, '');
const kunci = process.env.MODUL_ROUTER_KEY || (cfg.kunciEnv ? process.env[cfg.kunciEnv] : '') || '';

const promptPath = join(root, '.claude/modul/agen', `${args.peran}.md`);
if (!existsSync(promptPath)) die(`prompt peran tidak ada: ${promptPath}`);
const sisip = ['.claude/modul/agen/_umum.md', '.claude/modul/proyek.md']
  .map((f) => join(root, f))
  .filter((f) => existsSync(f))
  .map((f) => readFileSync(f, 'utf8'));
const system = [...sisip, readFileSync(promptPath, 'utf8')].join('\n\n');
const masuk = (args.masuk || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
let user = (args.tugas ? args.tugas + '\n\n' : '') + 'Bahan:\n';
for (const f of masuk) {
  const p = join(root, f);
  if (!existsSync(p)) die(`file masuk tidak ada: ${f}`);
  user += `\n=== FILE: ${f} ===\n${readFileSync(p, 'utf8')}\n`;
}
const maks = cfg.maksHuruf || 400000;
if (user.length > maks) die(`bahan ${user.length} huruf melebihi batas ${maks}. Kurangi file masuk.`);

const body = {
  model: id,
  temperature: 0.2,
  messages: [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ],
};
const timeoutMs = (cfg.timeoutDetik || 300) * 1000;
let res;
for (let coba = 1; coba <= 2; coba++) {
  try {
    const r = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(kunci ? { authorization: `Bearer ${kunci}` } : {}) },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (r.status >= 500 && coba === 1) continue;
    if (!r.ok) die(`9router menjawab HTTP ${r.status}: ${(await r.text()).slice(0, 500)}`);
    res = await r.json();
    break;
  } catch (e) {
    if (coba === 2)
      die(`gagal menghubungi ${base} (${e.name}: ${e.message}). 9router menyala? Lihat 07-pemasangan.md.`);
  }
}
const isi = res?.choices?.[0]?.message?.content;
if (!isi) die(`jawaban tanpa isi: ${JSON.stringify(res).slice(0, 500)}`);
const dijawab = res.model || 'tidak-diketahui';
const sama = modelSama(id, dijawab);
const u = res.usage || {};
const header =
  `<!-- tanya-model · peran=${args.peran} · diminta=${args.model}(${id}) · dijawab=${dijawab} · token=${u.prompt_tokens ?? '?'}/${u.completion_tokens ?? '?'} · ${new Date().toISOString()} -->\n` +
  (sama
    ? ''
    : `> ⚠️ MODEL BERBEDA: diminta ${id}, dijawab ${dijawab}. Perlakukan hasil ini sebagai tidak dipercaya (06-swarm.md).\n`) +
  '\n';
const out = join(root, args.keluar);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, header + isi.trim() + '\n');
console.log(`${sama ? '✅' : '⚠️ MODEL BERBEDA'} ${args.peran} → ${args.keluar} (dijawab ${dijawab})`);
process.exit(sama ? 0 : 3);

function modelSama(a, b) {
  const n = (s) => String(s).toLowerCase().split('/').pop();
  return n(a) === n(b) || n(b).startsWith(n(a)) || n(a).startsWith(n(b));
}
function parseArgs(a) {
  const o = {};
  for (let i = 0; i < a.length; i++)
    if (a[i].startsWith('--')) o[a[i].slice(2)] = a[i + 1]?.startsWith('--') ? 'true' : a[++i];
  return o;
}
