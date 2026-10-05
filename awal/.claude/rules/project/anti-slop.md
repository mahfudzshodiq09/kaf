# Anti-Slop: Kode & Laporan yang Jujur dan Seperlunya

"AI slop" = hasil kerja AI yang terlihat rapi tetapi berlebihan, rapuh, atau tidak jujur. Aturan ini berlaku untuk
**setiap** perubahan kode, test, dan laporan — baik lewat `/modul` maupun `/ecc:orch-*`.

Bagian A diadaptasi dari *andrej-karpathy-skills* (`CLAUDE.md`, lisensi MIT,
https://github.com/multica-ai/andrej-karpathy-skills — terinspirasi pengamatan Andrej Karpathy tentang kesalahan umum LLM saat menulis kode).
Disalin & diterjemahkan (bukan dipasang sebagai plugin) agar isinya tidak berubah tanpa sepengetahuan pemilik.
Untuk tugas yang benar-benar sepele, pakai akal sehat.

---

## A. Empat prinsip

### A1. Pikir dulu sebelum menulis kode
**Jangan berasumsi. Jangan menyembunyikan kebingungan. Tunjukkan pilihan.**
- Tulis asumsi secara eksplisit (di bagian Klarifikasi/Hasil file tugas). Ragu → tanya, jangan menebak.
- Bila ada beberapa tafsiran, sebutkan semuanya — jangan memilih diam-diam.
- Bila ada cara yang lebih sederhana, katakan. Membantah itu boleh bila beralasan.
- Bila ada yang tidak jelas, berhenti. Sebutkan apa yang membingungkan. Tanya.

### A2. Sederhana dulu
**Kode sesedikit mungkin yang menyelesaikan masalah. Tidak ada yang spekulatif.**
- Tidak ada fitur di luar yang diminta (butir K / tugas).
- Tidak ada abstraksi untuk kode yang hanya dipakai sekali (interface/factory/"helper generik" dengan satu pemakai).
- Tidak ada "fleksibilitas" atau "bisa dikonfigurasi" yang tidak diminta. Parameter yang boleh diatur hanya yang diputuskan sebagai butir K.
- Tidak ada penanganan error untuk kejadian yang mustahil (lihat C1).
- Bila menulis 200 baris dan bisa 50, tulis ulang.
- Uji: *"Apakah senior engineer akan bilang ini berlebihan?"* Ya → sederhanakan.

### A3. Ubah seperlunya
**Sentuh hanya yang perlu. Bereskan hanya kekacauan sendiri.**
- Jangan "memperbaiki" kode, komentar, atau format di sekitarnya — **termasuk di dalam file yang diizinkan tugas**.
- Jangan refactor yang tidak rusak. Refactor = tugas tersendiri (`/ecc:orch-refine-code`).
- Ikuti gaya yang sudah ada, walau Anda akan menulisnya berbeda.
- Melihat kode mati yang bukan buatan sendiri → **sebutkan** di Hasil tugas, jangan dihapus.
- Hapus import/variabel/fungsi yang menjadi tidak terpakai **akibat perubahan Anda sendiri**.
- Uji: *setiap baris yang berubah bisa ditelusuri ke tugas yang sedang dikerjakan.*

### A4. Kerja berdasarkan target yang bisa dicek
**Tentukan kriteria sukses. Ulangi sampai terbukti.**
- "Tambah validasi" → "tulis test untuk input salah, lalu buat lulus".
- "Perbaiki bug" → "tulis test yang mereproduksi bug, lalu buat lulus" (TEST-08).
- "Refactor X" → "test lulus sebelum dan sesudah".
- Tugas bertahap → rencana singkat berisi langkah + titik cek.

---

## B. Larangan tambahan (khas siakad)

| # | Jangan | Lakukan |
|---|---|---|
| B1 | Komentar yang mengulang kode (`// ambil data mahasiswa` di atas `getMahasiswa()`) | Komentar hanya untuk **kenapa** / sumber aturan (CODE-12). Tidak perlu komentar → jangan ditulis. |
| B2 | JSDoc panjang untuk fungsi yang jelas dari namanya | Nama yang jelas. JSDoc hanya untuk `*.rules.ts` (sumber aturan) & API publik package. |
| B3 | Memakai fungsi/opsi library dari ingatan | Cek dokumentasi versi yang dipakai (`ecc:docs-lookup`) bila tidak yakin; typecheck harus lulus. Tidak mengarang API. |
| B4 | Test yang tidak bisa gagal (`expect(true)`, hanya cek "tidak error", mock yang mengembalikan jawaban yang diuji) | Setiap test punya **bukti RED**; assertion memeriksa hasil bisnis (nilai, status, pesan). |
| B5 | Mengubah test supaya lulus | Implementasi yang diperbaiki. Test hanya diubah bila test-nya salah — hanya oleh Perancang Uji (`kunci-tes --buka` + alasan); pembangun menandai `blokir`. |
| B6 | Klaim "semua test lulus", "sudah dicek", "aman" tanpa bukti | Tempel output asli. Tulis juga **apa yang TIDAK dicek**. |
| B7 | Nama generik: `data`, `result`, `handleProcess`, `utils.ts`, `helpers.ts` | Nama domain (CODE-01): `pesertaKelas`, `hitungIps`, `krs.rules.ts`. |
| B8 | Membuat ulang helper yang sudah ada | Cari dulu di `packages/core`, `packages/ui`, dan modul terkait. |
| B9 | Log berlebihan ("masuk fungsi X", "data: …") | Log hanya peristiwa penting & error (CODE-09); tanpa data pribadi. |
| B10 | Tampilan "keren" yang tidak diminta (animasi, gradien, kartu dekoratif) | Ikuti UI-01..16 & `design_system.md`. |

---

## C. Penanganan error (menyelesaikan bentrok dengan ECC)

ECC `common/coding-style.md` menyuruh "tangani error di setiap level". Di project ini yang berlaku:

1. **Validasi & tangani error di pintu masuk**: input user (Zod, CODE-05), layanan luar (Feeder, bank, Xendit, Resend, S3), database (konflik, duplikat).
2. **Jangan membungkus setiap fungsi dengan `try/catch`.** Error yang tidak bisa ditangani dibiarkan naik ke `withAuth()` / `error.tsx` (CODE-07) — di sana dicatat & diubah jadi pesan aman.
3. **Dilarang menelan error:** `catch {}` kosong, `catch (e) { return null }`, `catch` yang hanya `console.log`, atau nilai cadangan yang menyembunyikan kegagalan (mis. mengembalikan `[]` saat database gagal).
   `catch` hanya boleh bila **benar-benar menangani**: mengubah ke `AppError` bertipe, mencoba ulang dengan batas, atau fallback yang **disengaja & tertulis alasannya**.
4. Tidak ada pengecekan untuk kejadian yang dijamin mustahil oleh tipe/validasi sebelumnya.

---

## D. Langkah "bersih-bersih" (di `/modul <nnn> review`, oleh model kuat)

Jalankan pada diff rentang review, lalu catat temuan yang relevan di `05-review.md` (yang serius → tugas `perbaikan`, dikerjakan pembangun):

| Agent | Mencari |
|---|---|
| `ecc:code-simplifier` | Kode berlebihan, abstraksi sekali pakai, duplikasi (A2, B8) |
| `ecc:silent-failure-hunter` | Error yang ditelan, fallback yang menyembunyikan kegagalan (C3) |
| `ecc:comment-analyzer` | Komentar yang mengulang kode / usang (B1, B2) |
| `ecc:pr-test-analyzer` | Test yang lemah / tidak bisa gagal (B4, B5) |

Temuan yang **tidak** diperbaiki → tulis di "Utang kecil" `05-review.md` beserta alasannya.
Tugas yang hanya mengubah dokumen / konfigurasi kecil boleh melewati langkah ini (tulis "dilewati: <alasan>").

---

## E. Tanda aturan ini berjalan

- Diff lebih kecil dan setiap baris bisa dijelaskan kaitannya dengan tugas.
- Lebih sedikit tulis-ulang karena terlalu rumit.
- Pertanyaan klarifikasi muncul **sebelum** kode ditulis, bukan setelah salah.
- Walkthrough jujur: ada bagian "yang tidak dicek".
