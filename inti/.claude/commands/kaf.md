---
description: Workflow modul v2 — plan (BRD) → prd (PRD) → build (kode) → review (perbaikan & testing). Mengetik prd/build = menyetujui dokumen sebelumnya.
argument-hint: 'rangkum [slug] | plan "<ide>" | plan <file.md> | plan <nnn> [catatan] | prd <nnn> [catatan] | build <nnn> [3|1-10|1,3] [--opus] | review <nnn> | uat <nnn> | rilis <nnn> | ubah <nnn> <ID> | status <nnn> | daftar | bantuan'
---

# /kaf v2

Argumen: **$ARGUMENTS**

Profil project (stack, struktur, perintah, sumber): `.claude/modul/proyek.md`. Aturan agent **R1–R15**: `docs/modul-v2/04-aturan.md`. Format artifact: `docs/modul-v2/03-artifact.md`. Desain: `docs/modul-v2/`.

## Perintah → file yang dibaca

| Argumen | Baca & ikuti | Persetujuan |
|---|---|---|
| `rangkum [slug]` | `.claude/modul/tahap/rangkum.md` (simpan hasil brainstorming ke `PLAN/_ide/<slug>.md`) | – |
| `plan "<ide>"` / `plan <file.md>` / `plan <nnn> [catatan]` | `.claude/modul/tahap/plan.md` | – |
| `prd <nnn> [catatan]` | `.claude/modul/tahap/prd.md` | Mengetiknya = **menyetujui BRD** (baris K terisi) |
| `build <nnn> [rentang] [--opus]` | `.claude/modul/tahap/build.md` | Mengetiknya = **menyetujui PRD** (K, DATA, KONTRAK terisi) |
| `review <nnn>` | `.claude/modul/tahap/review.md` | – |
| `uat <nnn>` · `rilis <nnn>` · `ubah <nnn> <ID>` | `.claude/modul/tahap/<perintah>.md` | UAT/RILIS: `node scripts/modul/setujui.mjs <nnn>` di terminal |
| `status <nnn>` | – : jalankan `node scripts/modul/cek.mjs <nnn>` + `node scripts/modul/rencana.mjs <nnn>`, ringkas ≤ 10 baris | – |
| `daftar` | – : `node scripts/modul/index.mjs`, tampilkan tabelnya | – |
| `<nnn>` saja | – : `node scripts/modul/cek.mjs <nnn>`, sampaikan perintah "berikut" ke pemilik (jangan dikerjakan sendiri) | – |
| `bantuan` / kosong | – : tampilkan tabel ini + `docs/modul-v2/README.md` bagian "Sehari-hari". Tidak mengubah file | – |

Baca **hanya** file perintah itu (dan file `langkah/` yang ia sebut, satu per satu saat tiba gilirannya).

## Persetujuan

- Persetujuan dicatat oleh **hook** saat pemilik *mengetik* `/kaf prd` atau `/kaf build` (lihat konteks `[setujui-ketik] …`). Baris ⏳ tidak pernah ikut disetujui.
- AI **tidak pernah** menulis `persetujuan.json`/`kunci-tes.json`, mengisi kolom Status keputusan, menjalankan `setujui`, atau memanggil `/kaf prd|build` sendiri (R6).
- Ditolak penjaga → jelaskan sebabnya dan jalan resminya (R7).

## Setiap selesai

`node scripts/modul/cek.mjs <nnn>` → `node scripts/modul/index.mjs` → commit dokumen (`docs(<nnn>): …`) → ringkasan sesuai file perintah, diakhiri **satu** perintah berikutnya untuk pemilik.
