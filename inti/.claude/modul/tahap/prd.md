# /modul prd · Opus — menghasilkan PRD

Mengetik perintah ini = pemilik **menyetujui BRD**. Hook sudah mencatatnya (lihat konteks `[setujui-ketik]`). Tidak ada konteks itu? Hook belum terpasang: sampaikan ke pemilik, minta `node scripts/modul/setujui.mjs <nnn>` di terminal, lalu lanjut.

PRD v2 = `04-rancangan.md` (Data, Kontrak, Catatan Teknis, Tugas) + `tugas/NN-*.md`.

1. `node scripts/modul/cek.mjs <nnn>`. Ada catatan dari pemilik (`/modul prd <nnn> <catatan>`) → terapkan pada rancangan.
2. Ikuti `langkah/rancang.md`.
3. Butuh keputusan bisnis baru saat merancang → baris K baru (R1–R2: cek dulu, tanya pilihan ganda). Baris baru ini ikut disetujui saat pemilik mengetik `/modul build`.
4. `node scripts/modul/cek.mjs <nnn>`: 0 galat, kecuali galat "Bukti RED"/"belum dikunci" (dikerjakan saat build).

## Ringkasan akhir (wajib, ≤ 25 baris, teknis boleh)

1. **Data:** tabel/kolom baru + 1 contoh isi. Atau "tidak ada perubahan database".
2. **Kontrak:** nama fungsi/aksi + satu baris kegunaan.
3. **Tugas:** `| No | Judul | Butir | Bergantung |`.
4. **Keputusan baru** dari tahap ini (✏️), bila ada.
5. Penutup persis:
   > Kalau sudah sesuai, ketik **`/modul build <nnn>`** (semua tugas) atau **`/modul build <nnn> 1-3`**: sekaligus menyetujui Data, Kontrak, dan keputusan baru.
   > Mau mengubah? **`/modul prd <nnn> <catatan>`**.
