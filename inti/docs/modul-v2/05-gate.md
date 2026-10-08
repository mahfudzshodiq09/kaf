# 05 · Persetujuan & Penjaga `/kaf` v2

## Butir yang disetujui

| Butir | Sumber hash | Mengunci |
|---|---|---|
| `K<n>` | ID + Kalau + Maka di `03-keputusan.md` | Tugas yang mencantumkan `K<n>` di `butir:` |
| `DATA` | Isi `## Data` di `04-rancangan.md` | Tugas yang mencantumkan `DATA` |
| `KONTRAK` | Isi `## Kontrak` di `04-rancangan.md` | Tugas yang mencantumkan `KONTRAK` |
| `UAT` | Seluruh `06-uat.md` (tanpa baris Status) | Rilis |
| `RILIS` | Seluruh `07-rilis.md` (tanpa baris Status) | – |

Butir **sah** bila tercatat di `persetujuan.json` dengan hash yang sama dengan isi sekarang. Tugas **sah** bila semua butirnya sah.

**Tiga tingkat revisi terjadi otomatis**, tanpa perlu klasifikasi manual:

1. Ubah catatan, Sumber, Status, Catatan Teknis, atau isi tugas: tidak ada butir berubah, tidak ada yang terkunci.
2. Ubah satu baris K: hanya butir itu tidak sah, hanya tugas yang memakainya tertahan.
3. Ubah Data atau Kontrak: hanya tugas yang mencantumkan `DATA`/`KONTRAK` tertahan.

## Cara pemilik menyetujui

**Utama, lewat ketikan:** hook `UserPromptExpansion` (`.claude/hooks/setujui-ketik.mjs`). Hook ini hanya terpicu oleh perintah yang **diketik manusia**, bukan dipanggil AI.

| Pemilik mengetik | Yang disetujui |
|---|---|
| `/kaf prd <nnn>` | Semua baris K yang terisi & baru/berubah (BRD) |
| `/kaf build <nnn> [rentang]` | Semua K + DATA + KONTRAK yang terisi & baru/berubah (PRD) |

- Baris ⏳ tidak pernah ikut disetujui. `persetujuan.json` mencatat `oleh: "<nama git> (mengetik /kaf prd)"`.
- AI tidak bisa memicunya:
  - `UserPromptSubmit` diabaikan (event itu juga terpicu oleh giliran otomatis);
  - tool `Skill`/`SlashCommand` yang memuat `modul prd|build` ditolak hook;
  - `claude … /kaf prd|build` lewat Bash ditolak.
- Sebelum mengetik, pemilik melihat **tabel BRD** (di akhir `plan`) atau **ringkasan PRD** (di akhir `prd`). Itu pengganti Cek Pemahaman.

**Cadangan / UAT & RILIS, lewat terminal:**

```bash
pnpm modul:setujui 002            # tinjau & setujui butir yang menunggu, satu per satu (y/n/k/q)
pnpm modul:setujui 002 --lihat    # hanya melihat daftar
```

Menolak berjalan bila bukan terminal interaktif, atau ada env `CLAUDECODE`/`OPENCODE`/`CI`.

## Penjaga

| Lapisan | Di mana | Memeriksa |
|---|---|---|
| Hook Claude Code | `.claude/hooks/gate-modul.mjs` (Edit, Write, MultiEdit, NotebookEdit, Bash) | Lihat aturan file di bawah + Bash: `setujui`, menulis ke file terlindung, `--no-verify` |
| Hook yang sama, mode pembangun | `bangun.mjs` menjalankan `claude -p` dengan env `MODUL_PERAN=pembangun` | Aturan file yang sama + Bash: juga `kunci-tes`, `review.mjs`, `bangun.mjs`, agent lain (`claude`/`opencode`), tambah dependency; alat Skill/Task/Web ditolak |
| Izin pembangun | `--allowedTools` dari `bangun.mjs` (`pembangunBash` di `proyek.json`, bawaan sesuai lockfile) | Bash hanya perintah verifikasi (lint/typecheck/test/e2e/build/format), `git status/diff/add/commit/log/show`, `status.mjs`, `cek.mjs`, `rencana.mjs` |
| CI | `scripts/modul/check-gate.mjs` (required check) | **Per commit**: trailer `Tugas: N`, file ⊂ tugas N, tugas sah, test terkunci tidak berubah, file terlindung tidak berubah tanpa label `perawatan-modul`, gerbang UAT |

### Aturan file (orkestrator & pembangun memakai fungsi yang sama: `periksaFile()` di `lib.mjs`)

1. **File terlindung** → ditolak, kecuali Claude Code dijalankan dengan `MODUL_PERAWATAN=1` (pembangun tidak pernah mewarisinya) (diset pemilik saat membuka tool, bukan oleh AI):
   `scripts/modul/**`, `.claude/hooks/**`, `.claude/settings.json`, `.claude/modul/proyek.json`, `.claude/modul/kaf.json`, `.github/workflows/modul-gate.yml`, `PLAN/*/persetujuan.json`, `PLAN/*/kunci-tes.json`.
2. File di luar folder kode (`.claude/modul/proyek.json`: `apps/`, `packages/`) → boleh.
3. Bukan branch modul (`feat/<nnn>-<slug>`) → boleh (CI meminta label `non-modul`).
4. Jumlah tugas aktif harus tepat **1**. Tugas itu harus **sah**.
5. Status `tes` → file di `tes:` + **stub** di `file:` (tanda tangan Kontrak yang melempar `BELUM_DIIMPLEMENTASI`).
6. Status `kerja`/`perbaikan` → file di `file:` atau "selalu boleh", **dan bukan** test yang terkunci.

## Peta: kekurangan v1 → penutupnya

| v1 | v2 |
|---|---|
| A1 hash satu dokumen utuh | Hash per butir |
| A2 temuan kecil memicu revisi besar | Review hanya mengubah status tugas; butir tidak tersentuh |
| A3 daftar file kaku | "Selalu boleh" untuk `package.json` & lockfile |
| A4 modul terlalu besar | Batas rancangan 400 baris memaksa modul dipecah |
| B1 AI bisa menjalankan `approve` | Persetujuan hanya lewat ketikan pemilik (hook UserPromptExpansion) atau terminal interaktif; AI dicegah memanggil keduanya |
| B2 AI bisa mengubah penjaga | Daftar file terlindung + label `perawatan-modul` di CI |
| B3 status 🟡 melebarkan izin | Tepat 1 tugas aktif; >1 = semua edit ditolak |
| B4 Bash tidak dijaga | Hook Bash + allowlist Bash pembangun + CI per commit |
| B5 hook hanya Claude Code | Pembangun juga berjalan di Claude Code → hook yang sama |
| B6 CI cek gabungan | CI cek per commit + trailer |
| C1–C4 konteks berat | Router ringkas + file per tahap; rules ECC dipindah; tugas ≤ 100 baris |
| D1 pembangun menulis test sendiri | Test ditulis Opus & dikunci |
| D2 model tidak tercatat | tanya-model mencatat model penjawab; Hasil tugas wajib mencatat model |
| D4 bukti RED lemah | R12 + `kunci-tes` menolak bila Bukti RED kosong |
| D5 cek kartu dangkal | `cek.mjs`: batas ukuran, frontmatter, butir ada, telusur `[ID]` di test |
| D6 script tanpa test | `scripts/modul/test/*.test.mjs` (node:test), dijalankan di CI |

## Batas yang jujur

- AI yang **sengaja** berniat buruk di komputer yang sama tetap bisa mencari celah, misalnya membuat terminal palsu. Penjaga ini dirancang untuk **agent yang ceroboh atau "terlalu membantu"**, bukan penyerang.
- Penjaga terakhir yang tidak bisa dilewati adalah **CI + branch protection `main`** (`modul-gate` wajib lulus) dan review PR olehmu.
- Kalau ada perubahan `persetujuan.json` di PR yang tidak kamu kenali, jangan merge.
