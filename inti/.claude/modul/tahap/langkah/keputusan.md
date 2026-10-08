# Langkah plan-4 — Keputusan · Opus

Tujuan: semua aturan bisnis modul ini menjadi baris **Kalau → Maka** yang disetujui pemilik. **Pertanyaan ditanyakan sekali saja.**

0. **Ada `sumber/ide.md`** → setiap baris "Sudah diputuskan pemilik" langsung jadi baris K (Sumber `[PEMILIK: ide.md]`), tanpa ditanyakan. Bertentangan dengan `PLAN/KEPUTUSAN.md`/pedoman → tanya **sekali**, sebutkan dua versinya. "Masih terbuka" → masuk daftar pertanyaan.
1. **R1, wajib.** Baca `03-keputusan.md`, `PLAN/KEPUTUSAN.md`, `docs/SPESIFIKASI-BISNIS.md`, `sumber/ide.md` (bila ada). Buat daftar pertanyaan dari baris ⏳ + Gap. Buang yang sudah terjawab, **termasuk versi terbaliknya** ("ditolak?" = "diterima?").
2. Lengkapi skenario dengan mempertimbangkan: wajib/opsional; kapan dalam kalender akademik; siapa boleh melihat/mengubah (peran & cakupan, UU PDP); beda per periode/prodi/angkatan (parameter?); dampak ke kelulusan/biaya/PDDikti; kasus gagal (data tidak ada, dobel, terlambat, dua orang bersamaan).
3. Wawancara (R2): `AskUserQuestion`, ≤ 4 pertanyaan per putaran, opsi rekomendasi pertama + alasan bersumber. Setiap jawaban **langsung** ditulis sebagai baris K (Sumber `[PEMILIK]`, atau sumber aslinya bila pemilik memilih sesuai pedoman).
4. Aturan menulis baris:
   - Satu baris = satu kejadian. Kalau: kejadian/kondisi konkret. Maka: hasil yang bisa dites (status, pesan, angka).
   - Kolom Kalau/Maka ≤ 300 huruf. Lebih panjang → pecah jadi K baru.
   - Mengubah baris yang **sudah ✅** hanya bila pemilik memintanya (`/kaf ubah <nnn> <ID>`). Kasus baru = baris baru.
   - Belum bisa dijawab → biarkan `⏳` + siapa yang memutuskan.
   - Jangan isi kolom Status (R6).
5. Selesai. Ringkasan ditulis oleh file perintah `plan.md`.
