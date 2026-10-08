# /kaf ubah <nnn> <ID> · Opus

Hanya atas permintaan pemilik.

1. Tampilkan baris/bagian `<ID>` sekarang + **tugas yang memakainya** (`butir:`), beserta statusnya.
2. Tanyakan perubahan yang diinginkan (pilihan ganda bila bisa). Terapkan **hanya** pada butir itu.
3. Akibatnya (otomatis): `<ID>` menjadi "berubah sejak disetujui", dan hanya tugas yang memakainya tertahan.
   - Tugas yang sudah `selesai` dan memakai `<ID>` → sarankan ke pemilik: buat tugas perbaikan baru (status `rancang`), atau ubah tugas lama ke `perbaikan` lewat `status.mjs`. Test-nya perlu dibuka lagi oleh Perancang Uji (`kunci-tes --buka`).
4. Persetujuan ulang: pemilik mengetik `/kaf prd <nnn>` (baris K) atau `/kaf build <nnn>` (K, DATA, KONTRAK) — atau `node scripts/modul/setujui.mjs <nnn>` di terminal.
