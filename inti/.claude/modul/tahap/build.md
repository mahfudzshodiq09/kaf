# /modul build · Opus mengatur, DeepSeek mengerjakan

Mengetik perintah ini = pemilik **menyetujui PRD** (K, DATA, KONTRAK yang terisi). Hook sudah mencatatnya (konteks `[setujui-ketik]`).

Argumen: `<nnn> [rentang] [--opus]`. Rentang: `3` · `1-10` · `1,3,5-7`. Kosong = semua tugas yang belum selesai.

## 0. Siapkan
1. `node scripts/modul/rencana.mjs <nnn> [rentang]`: daftar tugas, status, langkah.
2. Tanpa `--opus`, cek pembangun tersedia: `opencode --version` dan `curl -s -m 5 http://localhost:20128/v1/models > /dev/null`. Gagal → **berhenti**, beri tahu pemilik: nyalakan 9router/OpenCode, atau ketik ulang dengan `--opus` (build oleh Opus, lebih mahal).

## 1. Per tugas (urut nomor; jalankan ulang `rencana.mjs` sebelum tiap tugas)
- `selesai`/`batal` → lewati. `belum sah` atau `menunggu #x` yang belum selesai → lewati, catat.
- **`rancang`/`tes` → tulis test dulu:** ikuti `langkah/tes.md` (Opus: test + stub + Bukti RED + `kunci-tes` + commit).
- **`siap`/`kerja` → kode oleh DeepSeek.** Jalankan via Bash dengan timeout 600000 ms:
  ```bash
  opencode run --agent pembangun "Mode otomatis. Kerjakan tugas <no> modul <nnn> sesuai prosedurmu. Tidak ada pemilik yang menjawab: bila kurang jelas, jangan menebak — tandai blokir dengan pertanyaan pilihan ganda di alasannya."
  ```
  `--opus` → kerjakan sendiri persis `.claude/modul/agen/pembangun.md` (catat "Model: Opus" di Hasil).
- **Periksa hasilnya:** `node scripts/modul/rencana.mjs <nnn> <no>` + `node scripts/modul/cek.mjs <nnn>`.
  - `selesai` → lanjut.
  - `blokir` → catat alasannya, lanjut ke tugas yang tidak bergantung.
  - masih `kerja` (timeout/terhenti) → `node scripts/modul/status.mjs <nnn> <no> blokir "pembangun terhenti: <ringkas output>"`.
- Jangan memperbaiki kode DeepSeek sendiri. Kualitas diperiksa di `/modul review`.

## 2. Tugas blokir → tanya pemilik sekarang
Untuk setiap `blokir`, tanya pemilik dengan **AskUserQuestion** (pilihan dari alasan blokir):
- Jawaban **teknis** (tidak menyentuh aturan/kontrak/schema): tulis di `## Klarifikasi` tugas → `status.mjs <nnn> <no> siap "dijawab pemilik"` → ulangi langkah DeepSeek untuk tugas itu.
- Jawaban **aturan bisnis** → baris K baru. Tugas tetap `blokir` sampai pemilik mengetik `/modul build <nnn> <no>` (persetujuan K baru).
- Test terkunci tampak salah → `node scripts/modul/kunci-tes.mjs <nnn> <no> --buka "<alasan>"` → perbaiki test (`langkah/tes.md`) → DeepSeek lagi.

## 3. Ringkasan akhir (≤ 15 baris)
`| No | Hasil | Model | Catatan |` (selesai/blokir/dilewati) + jumlah commit. Penutup:
> Berikutnya: **`/modul review <nnn>`**. (Bila masih ada blokir yang menunggu keputusan: `/modul build <nnn> <no>` setelah menjawab.)
