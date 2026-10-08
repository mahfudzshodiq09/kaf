# Langkah plan-1 — Mulai · Opus

1. Cek `PLAN/INDEX.md` & `PLAN/KEPUTUSAN.md`: apakah kebutuhan ini sudah tercakup modul lain? Bila ya, sampaikan dan berhenti.
2. Tentukan ukuran (tabel di `docs/modul-v2/01-alur.md`). **Kecil** → jangan buat modul; arahkan ke `/ecc:orch-*` dan berhenti.
   Ada catatan ide → ukuran, slug, cerita, DoD, dan di luar cakupan diambil dari situ.
3. `node scripts/modul/baru.mjs <slug>` → nama modul `<nnn>-<slug>`. Lalu `git checkout -b feat/<nnn>-<slug>`.
   Ada catatan ide → salin ke `PLAN/<m>/sumber/ide.md` (isi utuh, jangan diringkas).
4. Wawancara singkat (≤ 4 pertanyaan pilihan ganda) untuk cerita pengguna, DoD, dan cakupan. **Jangan** menanyakan aturan bisnis rinci di sini, itu tempatnya tahap keputusan. Ada catatan ide → tanya hanya yang kosong/terbuka; bila semua sudah ada, lewati wawancara.
5. Isi `00-modul.md` (≤ 60 baris): App, Ukuran + alasan satu kalimat, cerita, DoD, di luar cakupan, modul terkait.
6. Minta pemilik mengonfirmasi **ukuran** di chat (pilihan ganda), lalu lanjut ke langkah berikutnya. Ukuran sudah ada di catatan ide → cukup sebutkan, tidak perlu ditanya.
