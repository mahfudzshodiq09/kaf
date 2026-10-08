# 08 · Uji Kering & Pilot

## Hasil uji kering (2026-10-04, Node 22, Linux)

`pnpm modul:test` → **37 test, 37 lulus, 0 gagal.**

| File test | Yang dibuktikan |
|---|---|
| `lib.test.mjs` (7) | Hash butir (Status/Sumber tidak memengaruhi, Maka memengaruhi); ⏳ tidak bisa disetujui; **ubah K2 hanya menahan tugas yang memakai K2**; Catatan Teknis bebas diubah; batas ukuran & `[ASUMSI]` ditolak; tahap mengikuti persetujuan |
| `penjaga.test.mjs` (8) | File penjaga terkunci (kecuali mode perawatan); tepat 1 tugas aktif; tugas belum sah ditolak; status `tes` hanya test + stub; test terkunci tidak bisa diedit; Bash: `setujui`, `--no-verify`, tulis ke penjaga/kode lain ditolak, perintah baca & redirect aman boleh; pembangun tidak bisa `kunci-tes` |
| `skrip.test.mjs` (6) | `setujui` **menolak** tanpa terminal & dari tool AI (`--lihat` boleh); `kunci-tes` butuh Bukti RED + test `[K..]`, `--buka` butuh alasan; transisi status, dependensi, Hasil, commit `Tugas: N`; `tanya-model` mencatat model penjawab & menandai **MODEL BERBEDA** (server 9router tiruan); `baru` |
| `ci.test.mjs` (7) | CI per commit: trailer wajib, file di luar tugas, tugas fiktif, test terkunci diubah, butir berubah, file penjaga tanpa label, branch non-modul, gerbang UAT |
| `adaptor.test.mjs` (3) | Hook Claude Code (input JSON asli → exit 2); hook mode pembangun (`MODUL_PERAN=pembangun`) lebih ketat; `bangun.mjs` menyusun env 9router & izin Bash dengan benar |
| `ketik.test.mjs` (4) | Mengetik `/kaf prd` menyetujui K terisi (3 bentuk input hook), `/kaf build` + DATA & KONTRAK; ⏳ tidak pernah; `UserPromptSubmit` & perintah lain tidak menyetujui; AI tidak bisa memanggil lewat Skill/SlashCommand/`claude -p`; `rencana.mjs` (rentang, dependensi) |
| `simulasi.test.mjs` (1) | **Siklus penuh** modul latihan: baru → konteks → keputusan (K3 ⏳ tidak menahan) → rancang → tes (stub + RED + kunci) → build (dependensi, test terkunci) → ubah K3 di tengah build (tugas lain jalan) → review (cap) → UAT → rilis → `selesai`; INDEX & KEPUTUSAN dibangkitkan; CI lulus; lalu kode diubah tanpa review → CI menolak |

**Uji mutasi** (aturan sengaja dirusak, test harus gagal):

| Mutasi | Test gagal |
|---|---|
| Test terkunci boleh diedit | 2 |
| Kolom Status ikut di-hash | 14 |
| `setujui` boleh dari tool AI | 2 |
| CI tidak cek trailer | 1 |
| Boleh > 1 tugas aktif | 1 |
| `UserPromptSubmit` (giliran otomatis) ikut menyetujui | 1 |
| `/kaf prd` ikut menyetujui DATA/KONTRAK | 2 |
| AI boleh memanggil `/kaf build` lewat Skill | 1 |

**Bug yang ditemukan uji kering & sudah diperbaiki:**

1. Bagian Data "tidak ada perubahan" menahan tahap rancang padahal tidak dipakai tugas (melanggar P2).
2. Hook memeriksa tool baca (Read).
3. Bukti RED mustahil tanpa file implementasi → ditambah **stub kontrak** di tahap tes (R12).

**Konteks agent:** satu tahap `/modul` ≈ **4 ribu token** (CLAUDE.md + rules + router + 1 file tahap), dibanding v1 ≈ **71 ribu** (rules ECC + modul.md + PRD 001). Prompt pembangun ≈ 1 ribu token + file tugasnya.

## Yang BELUM diuji (butuh Mac-mu)

- Panggilan 9router sungguhan (`07-pemasangan.md` §3).
- Hook di Claude Code sungguhan (§4), terutama **nama field input `UserPromptExpansion`** untuk persetujuan lewat ketikan.
- `bangun.mjs` sungguhan: Claude Code headless lewat 9router dengan model DeepSeek (`node scripts/modul/bangun.mjs --cek`, lalu satu tugas nyata).
- `setujui` interaktif di terminal (y/n/k/q).
- GitHub Actions sungguhan dan Node 24 (§2, §7).
- Kualitas hasil Gemini/DeepSeek dengan prompt peran ini. Itu baru terlihat di pilot.

## Pilot

Pilih satu modul **Sedang** yang nyata dan kecil, misalnya fitur yang tidak menyentuh uang/nilai. Jalankan semua tahap. Setelah selesai, isi:

| Ukuran | Target | Hasil |
|---|---|---|
| Persetujuan ulang karena revisi (per butir) | ≤ 1 | |
| Pertanyaan berulang untuk kasus yang sama | 0 | |
| `04-rancangan.md` | ≤ 400 baris | |
| Tugas lolos review tanpa ditulis ulang | ≥ 80% | |
| Tugas dikerjakan DeepSeek | ≥ 80% | |
| Hasil tanya-model `⚠️ MODEL BERBEDA` | 0 | |
| Waktu dari `baru` sampai UAT | – (catat) | |
| Hal yang membingungkan / macet | – (catat) | |

Hasil pilot dipakai untuk menyetel v2 (prompt peran, batas ukuran, izin bash pembangun) sebelum dipakai untuk semua modul.
