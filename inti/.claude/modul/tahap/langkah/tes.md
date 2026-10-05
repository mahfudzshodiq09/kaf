# Langkah build-1 — Tes · Opus (+ Gemini kasus tepi)

Test adalah spesifikasi (P5). Ditulis model kuat, lalu **dikunci** sebelum pembangun mulai.

Untuk satu tugas berstatus `rancang` (dipanggil dari `build.md`):

1. Bila belum berstatus `tes`: `node scripts/modul/status.mjs <nnn> <no> tes`. Ditolak karena butir belum sah/⏳ → catat untuk pemilik, lewati tugas ini.
2. Tugas `*.rules.ts` atau modul Besar: minta kasus tepi
   `node scripts/modul/tanya-model.mjs --peran kasus-tepi --model gemini --masuk PLAN/<m>/03-keputusan.md,PLAN/<m>/tugas/<NN>-*.md --keluar PLAN/<m>/_swarm/tepi-<no>.md`
   lalu pilih yang relevan. Kasus tepi yang ternyata butuh keputusan → baris K ⏳ (bukan test).
3. Tulis file di `tes:` (penjaga hanya mengizinkan `tes:` + stub di `file:`):
   - Setiap butir K tugas punya ≥ 1 test bernama `[K<n>] …` yang memeriksa **hasil bisnis** (nilai/status/pesan/kelas error spesifik). Termasuk kasus ditolak & kasus batas (TEST-02/03). Tanpa `toThrow()` kosong.
   - Pola test meniru test yang sudah ada (Vitest/Playwright, AAA, data palsu R14).
4. **Stub** (bila file implementasi belum ada): buat file di `file:` yang hanya berisi tanda tangan dari `## Kontrak` dengan isi `throw new Error('BELUM_DIIMPLEMENTASI')`. Tidak ada logika apa pun.
   Jalankan test → **semua** harus gagal (R12). Test yang lulus terhadap stub = test lemah → perbaiki test-nya.
5. Tempel output asli (gagal karena assertion/BELUM_DIIMPLEMENTASI) ke `## Bukti RED` (blok kode).
6. `node scripts/modul/kunci-tes.mjs <nnn> <no>` → status `siap`. Lalu commit (`test(<scope>): … ` + baris kosong + `Tugas: <no>`).
7. Kembali ke `build.md`.
