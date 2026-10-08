# Catatan Versi kaf

## 2.3.0 — 2026-10-05
- **Brainstorming → plan.** `/kaf rangkum [slug]` menyimpan hasil chat brainstorming ke `PLAN/_ide/<slug>.md` (template `ide.md`: diputuskan / masih terbuka / di luar cakupan). `/kaf plan PLAN/_ide/<slug>.md` memakainya: disalin ke `PLAN/<m>/sumber/ide.md`, keputusan di catatan langsung jadi baris K tanpa ditanya ulang; yang ditanyakan hanya yang kosong, terbuka, atau bertentangan.

## 2.2.1 — 2026-10-05
- `bangun.mjs`: stdin `claude` ditutup (mencegah menggantung); `--cek` menguji langsung `/v1/messages` 9router (biasa & streaming) sebelum memanggil Claude Code.
- `bangun.mjs`: nama model 9router (mis. `ds/deepseek-v4-flash`) kini diterima Claude Code (`CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY`, `CLAUDE_CODE_DISABLE_UNKNOWN_MODEL_WINDOW_ENFORCEMENT`). `--cek` menampilkan kode keluar + pesan lengkap.

## 2.2.0 — 2026-10-05
- **OpenCode tidak dipakai lagi.** Pembangun (DeepSeek) kini dijalankan `scripts/modul/bangun.mjs`: Claude Code headless (`claude -p`) yang diarahkan ke 9router. Penjaga yang sama berlaku, lebih ketat untuk pembangun (`MODUL_PERAN=pembangun`): tidak boleh kunci/buka test, cap review, tambah dependency, agent lain, web.
- `node scripts/modul/bangun.mjs --cek`: cek `claude`, 9router, nama model, dan satu panggilan uji.
- Izin Bash pembangun: bawaan sesuai lockfile (pnpm/npm), bisa diganti lewat `pembangunBash` di `.claude/modul/proyek.json`.
- `kaf update` menghapus `.opencode/plugins/gate-modul.js` & `.opencode/commands/build.md`. `opencode.json` di project tidak disentuh (hapus sendiri bila tidak dipakai).

## 2.1.0 — 2026-10-05
- Perintah slash diganti **`/modul` → `/kaf`** (`/kaf plan`, `/kaf prd`, `/kaf build`, `/kaf review`, …). Persetujuan lewat ketikan kini mengenali `/kaf prd`/`/kaf build`.
- `kaf update` otomatis menghapus `.claude/commands/modul.md` lama.

## 2.0.0 — 2026-10-05
- Repo pertama: sumber tunggal `/modul` v2 untuk new_siakad, pmb-univet, siakad-uji.
- Empat perintah: `plan` → `prd` (= setujui BRD) → `build` (= setujui PRD, per tugas/rentang) → `review` (perbaikan + test sampai lulus).
- Persetujuan per butir lewat ketikan pemilik (hook `UserPromptExpansion`) atau terminal; AI tidak bisa memicunya.
- Test ditulis model kuat & dikunci; kode oleh DeepSeek (OpenCode) via 9router; penjaga file di Claude Code, OpenCode, dan CI.
- Profil project (`proyek.json`/`proyek.md`): `monorepo-pnpm` dan `nextjs-npm`.
- Installer: `install`, `update` (tidak menimpa berkas yang diubah lokal), `cek`.
