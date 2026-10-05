# Catatan Versi kaf

## 2.0.0 — 2026-10-05
- Repo pertama: sumber tunggal `/modul` v2 untuk new_siakad, pmb-univet, siakad-uji.
- Empat perintah: `plan` → `prd` (= setujui BRD) → `build` (= setujui PRD, per tugas/rentang) → `review` (perbaikan + test sampai lulus).
- Persetujuan per butir lewat ketikan pemilik (hook `UserPromptExpansion`) atau terminal; AI tidak bisa memicunya.
- Test ditulis model kuat & dikunci; kode oleh DeepSeek (OpenCode) via 9router; penjaga file di Claude Code, OpenCode, dan CI.
- Profil project (`proyek.json`/`proyek.md`): `monorepo-pnpm` dan `nextjs-npm`.
- Installer: `install`, `update` (tidak menimpa berkas yang diubah lokal), `cek`.
