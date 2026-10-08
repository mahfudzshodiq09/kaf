# /kaf plan · Opus — menghasilkan BRD

BRD v2 = `00-modul.md` (cerita, DoD, ukuran) + `01-konteks.md` (fakta, asumsi, gap) + `03-keputusan.md` (tabel Kalau → Maka).

## Modul baru: `/kaf plan "<ide>"` atau `/kaf plan <file.md>`

Argumen berupa path file `.md` yang ada (biasanya `PLAN/_ide/<slug>.md` dari `/kaf rangkum`, boleh juga file lain) = **catatan ide**:
- Salin ke `PLAN/<m>/sumber/ide.md` (setelah modul dibuat) dan pakai sebagai bahan utama di setiap langkah.
- Isi catatan **tidak ditanyakan ulang** (R1). Yang ditanyakan hanya yang kosong, "Masih terbuka", atau saling bertentangan.

Kerjakan berurutan. Baca tiap file langkah hanya saat tiba gilirannya:

1. `langkah/mulai.md`: slug dari ide (kebab-case), ukuran (Kecil → berhenti, arahkan ke `/ecc:orch-*`), cerita, DoD.
2. `langkah/konteks.md`: fakta bersumber (Gemini via tanya-model), asumsi, gap → baris K ⏳.
3. `langkah/solusi.md`: **hanya** bila ada alternatif nyata (Besar: swarm). Selain itu lewati + alasan 1 baris.
4. `langkah/keputusan.md`: wawancara pilihan ganda, isi semua K yang bisa dijawab (R1: cek dulu, tanya sekali).

## Lanjut / revisi: `/kaf plan <nnn> [catatan]`

Terapkan catatan pemilik. Isi ⏳ yang tersisa (`langkah/keputusan.md`), tambah fakta bila ada sumber baru (`langkah/konteks.md`).
Mengubah baris yang sudah ✅ hanya bila catatan pemilik memintanya, dan statusnya otomatis menjadi "berubah".

## Ringkasan akhir (wajib, ≤ 25 baris)

1. Satu kalimat: apa modul ini + ukurannya.
2. **Tabel BRD** (yang akan disetujui): `| ID | Kalau | Maka |` untuk semua K yang terisi. Baris yang **baru/berubah** sejak persetujuan terakhir ditandai ✏️.
3. ⏳ yang tersisa + siapa yang memutuskan. Tidak menghalangi selama tidak dipakai tugas.
4. Penutup persis:
   > Kalau sudah sesuai, ketik **`/kaf prd <nnn>`**: sekaligus menyetujui semua baris di atas.
   > Mau mengubah? **`/kaf plan <nnn> <catatan>`**.
