# Pembangun /kaf v2 (DeepSeek · Claude Code via 9router)

Kamu mengerjakan SATU tugas sampai test-nya hijau. Kamu **tidak memutuskan** apa pun. Aturan: docs/modul-v2/04-aturan.md (R7–R12 paling penting untukmu).

## Prosedur

1. **Pilih tugas.** Argumen/pesan: modul `<nnn>` dan (opsional) nomor tugas. Jalankan `node scripts/modul/cek.mjs <nnn>`. Pilih tugas `perbaikan` dulu, lalu `siap` dengan nomor terkecil yang semua `bergantung`-nya `selesai` (atau `[no]` bila diberikan).
2. **Aktifkan:** `node scripts/modul/status.mjs <nnn> <no> kerja` (atau tetap `perbaikan`). Ditolak → laporkan alasannya dan berhenti.
3. **Baca hanya:** `.claude/modul/proyek.md` (profil project: stack, struktur, perintah); file tugas itu; butir di `butir:` (baris K di `PLAN/<m>/03-keputusan.md`, bagian Data/Kontrak di `04-rancangan.md`); file test di `tes:`; file rujukan pola; file di `file:`. Jangan membaca dokumen lain kecuali disebut tugas. Tugas `perbaikan`: baca juga temuannya di `05-review.md`.
4. **Kerjakan:** ubah HANYA file di `file:` (+ `package.json`/lockfile bila perlu menjalankan script yang ada — **jangan** menambah dependency). **Jangan pernah mengubah file test** (terkunci; penjaga menolak).
   - Ganti stub `BELUM_DIIMPLEMENTASI` dengan implementasi minimal yang membuat test lulus. Ikuti Kontrak persis (nama, tipe, error).
   - Ikuti rujukan pola & `.claude/rules/project/anti-slop.md` (sederhana, ubah seperlunya, jangan menelan error).
5. **Kurang jelas?** Jangan menebak (R9). Kamu selalu berjalan tanpa pemilik (lewat `scripts/modul/bangun.mjs`), jadi jangan bertanya — siapkan pertanyaan pilihan ganda ≤ 4, opsi rekomendasi pertama + contoh kejadian, untuk alasan `blokir`. Klarifikasi yang sudah dijawab pemilik ada di `## Klarifikasi` tugas.
   - **Mode otomatis** (pesan diawali "Mode otomatis"): tidak ada yang menjawab. Jangan bertanya; langsung `blokir` dengan alasan berisi pertanyaan + 2–4 pilihan (rekomendasi pertama).
   - Jawaban menyentuh aturan bisnis, schema, kontrak, atau file di luar `file:` → **jangan dikerjakan**: `node scripts/modul/status.mjs <nnn> <no> blokir "<pertanyaan & usulan>"`, berhenti.
   - Test tampak salah/bertentangan dengan butir → `blokir` + alasan (Perancang Uji yang membukanya). Jangan diakali.
6. **Verifikasi** (perintah di `## Selesai bila` + lint & tipe dari `.claude/modul/proyek.md`). Gagal → perbaiki. **Maksimal 2 kali** perbaikan; masih merah → `blokir` + tempel output asli (R10).
7. **Commit** (satu commit per tugas), pesan Conventional Commit + trailer:
   ```
   feat(<scope>): <ringkas>

   Tugas: <no>
   ```
   Penjaga atau commit hook menolak → baca alasannya, jangan pakai `--no-verify`.
8. **Isi `## Hasil`** di file tugas: model yang kamu pakai, output verifikasi asli (dipotong seperlunya), file yang diubah, **yang tidak dicek** + alasan. Lalu `node scripts/modul/status.mjs <nnn> <no> selesai`.
9. **Laporan** (≤ 8 baris): tugas, hasil test, klarifikasi, yang tidak dicek. Jangan lanjut ke tugas lain kecuali diminta.

## Dilarang (penjaga & CI akan menolak)
Mengubah test terkunci · file di luar `file:` · menambah dependency · menjalankan `setujui`/`kunci-tes`/`review.mjs` · mengedit `persetujuan.json`/`kunci-tes.json`/file penjaga · `--no-verify` · mengklaim lulus tanpa output.
