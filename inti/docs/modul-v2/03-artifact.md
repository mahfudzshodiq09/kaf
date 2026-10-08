# 03 · Artifact `/kaf` v2

Lokasinya `PLAN/<nnn>-<slug>/`. Template ada di `.claude/modul/template/`. Batas ukuran diperiksa oleh `node scripts/modul/cek.mjs <nnn>`.

| File | Isi | Ditulis | Batas | Disetujui? |
|---|---|---|---|---|
| `00-modul.md` | Cerita pengguna, DoD, ukuran, app | Opus | 60 baris | Tidak (konfirmasi di chat) |
| `01-konteks.md` | Fakta `F` (bersumber), Asumsi `A`, Gap `G` | Gemini → Opus | 250 baris | Tidak |
| `02-solusi.md` | Opsi, trade-off, rekomendasi | Opus | 120 baris | Pilihan → baris `K` |
| `03-keputusan.md` | **Tabel keputusan** (pusat) | Opus; kolom Status oleh `setujui` | Tanpa batas baris, sel ≤ 300 huruf | **Ya, per baris** |
| `04-rancangan.md` | `## Data`, `## Kontrak`, `## Catatan Teknis`, `## Tugas` | Opus | 400 baris | **DATA & KONTRAK** |
| `tugas/NN-<slug>.md` | Satu tugas | Opus; bagian Hasil oleh pembangun | 100 baris | Tidak (dijaga test + review) |
| `05-review.md` | Temuan per tugas, cap | Opus | – | Tidak |
| `06-uat.md` | Skenario per peran, hasil | Gemini → Opus | 200 baris | **UAT** |
| `07-rilis.md` | Catatan rilis, panduan, aktivasi, rollback | Opus | 150 baris | **RILIS** |
| `persetujuan.json` | Hash butir yang disetujui | **Hanya** `setujui.mjs` | – | – |
| `kunci-tes.json` | Hash test yang dikunci per tugas | **Hanya** `kunci-tes.mjs` | – | – |
| `_swarm/*.md` | Hasil mentah tanya-model | tanya-model | – | Tidak |

`PLAN/INDEX.md` dan `PLAN/KEPUTUSAN.md` (semua keputusan ✅ lintas modul) dibangkitkan `node scripts/modul/index.mjs`. Jangan diedit manual.

## `03-keputusan.md`: format tabel

```markdown
| ID | Kalau | Maka | Sumber | Status |
|---|---|---|---|---|
| K1 | Mahasiswa mengajukan cuti | Status pengajuan "menunggu kaprodi" | [PERATURAN] Pedoman §5.3 | ✅ 2026-10-05 |
| K2 | Pengajuan cuti saat masih ada tunggakan SPP | ⏳ Ditolak, atau boleh dengan catatan? | [KAMPUS] | 📝 |
```

- **Hash butir = ID + Kalau + Maka** (spasi dirapikan). Mengubah Sumber atau Status **tidak** membatalkan persetujuan.
- `⏳` di kolom Maka = belum diputuskan. Baris ini tidak bisa disetujui, dan tugas yang memakainya otomatis tertahan.
- ID tidak boleh dipakai ulang. Keputusan yang dibatalkan: Maka diawali `BATAL:` + alasan (perlu disetujui juga).
- Rujukan lintas modul ditulis `002:K3`.
- Tanda sumber: `[PERATURAN]` `[REGULASI]` `[FEEDER]` `[KAMPUS]` `[SEVIMA]` `[EKSPOR]` `[DOKUMEN]` `[PEMILIK]`. Tidak ada `[ASUMSI]` di sini (asumsi tempatnya di konteks).

## `04-rancangan.md`: butir DATA & KONTRAK

- `## Data`: diff Prisma + **contoh isi** (data palsu) + catatan index/constraint. Hash = isi seluruh bagian.
- `## Kontrak`: blok kode tanda tangan fungsi/Server Action/route + tipe error. Hash = isi seluruh bagian.
- `## Catatan Teknis` dan `## Tugas` **tidak di-hash**. Mengubahnya tidak butuh persetujuan.

## `tugas/NN-<slug>.md`: format

```markdown
---
no: 3
judul: Aturan pengajuan cuti
butir: K1, K2, KONTRAK
file: apps/siakad/src/modules/cuti/cuti.rules.ts
tes: apps/siakad/src/modules/cuti/cuti.rules.test.ts
bergantung: 1
status: rancang
---
## Tujuan
1–3 kalimat.
## Rujukan pola
`apps/siakad/src/modules/krs/krs.rules.ts` — bentuk fungsi & error.
## Dilarang
Ubah schema · tambah dependency · sentuh file lain.
## Selesai bila
`pnpm test --filter @siakad/app-siakad -- cuti.rules` hijau · `pnpm lint && pnpm typecheck` hijau.
## Bukti RED
(diisi Perancang Uji)
## Klarifikasi
(diisi saat build: pertanyaan → jawaban)
## Hasil
(diisi pembangun: model, output verifikasi asli, yang tidak dicek)
```

- Frontmatter satu baris per kunci, nilai dipisah koma, boleh glob (`**`, `*`).
- `file:` = yang boleh diubah pembangun. `tes:` = yang ditulis Perancang Uji lalu dikunci.
- Selalu boleh tanpa ditulis: `apps/*/package.json`, `packages/*/package.json`, `pnpm-lock.yaml` (diatur di `.claude/modul/proyek.json`) (perubahan dependency tetap diperiksa review & CODEOWNERS).
- **Status:** `rancang` → `tes` → `siap` → `kerja` → `selesai`; cabang: `perbaikan` (dari review), `blokir`, `batal`. Hanya **satu** tugas boleh berstatus aktif (`tes`/`kerja`/`perbaikan`).
- Nama test wajib memuat ID butir: `it('[K2] menolak cuti bila ada tunggakan', …)`. Dari situ `cek` menelusuri butir → test secara otomatis (pengganti tabel traceability).

## Yang dihapus dari v1

| v1 | Penggantinya di v2 |
|---|---|
| BRD 247 baris | `00-modul` + `01-konteks` + `03-keputusan` |
| PRD 2.173 baris | `04-rancangan` ≤ 400 + `tugas/` ≤ 100 per tugas |
| Kartu Tugas berisi salinan aturan | Rujukan ID + test terkunci |
| `03-WALKTHROUGH.md` | Bagian Hasil di file tugas |
| Tabel traceability manual | Nama test `[ID]` + `cek` |
| `PLAN/approvals.json` global | `persetujuan.json` per modul |
| `docs/keputusan/INDEX.md` manual | `PLAN/KEPUTUSAN.md` dibangkitkan |
