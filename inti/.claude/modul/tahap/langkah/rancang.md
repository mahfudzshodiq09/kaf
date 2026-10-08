# Langkah prd-1 — Rancang · Opus (+ draf BE/FE bila Besar)

Syarat: baris K sudah disetujui (otomatis saat pemilik mengetik `/kaf prd`).

1. Baca: `00-modul.md`, `03-keputusan.md`, `.claude/modul/proyek.md` (stack, struktur, aturan teknis: baca hanya bagian/ID yang relevan), dan kode yang dirujuk di `01-konteks.md`.
2. Besar: minta draf paralel → `_swarm/rancang-be.md` (`--peran rancang-be --model deepseek`) & `_swarm/rancang-fe.md` (`--peran rancang-fe --model gemini`), bahan `00`, `01`, `03`. Gabungkan.
3. Tulis `04-rancangan.md` (≤ 400 baris; lebih → **pecah modul**):
   - `## Data`: diff Prisma, index/constraint, **contoh isi data palsu**. Tidak ada perubahan → tulis itu.
   - `## Kontrak`: blok kode tanda tangan fungsi `*.rules.ts`/service/Server Action/route + tipe error (sesuai aturan teknis project). Nama & tipe persis.
   - `## Catatan Teknis`: pola yang ditiru (path), aturan teknis yang berlaku (ID bila ada) & penyimpangan (bila ada → tanya pemilik, catat sebagai K), dampak lintas modul, PDDikti, migrasi data, izin. **Tanpa** aturan bisnis baru (R3).
   - `## Tugas`: tabel ringkas.
4. Pecah tugas (urutan: schema → rules → repository/service → action/API → UI → E2E). Satu tugas = satu sesi, idealnya 1–3 file. Buat `tugas/NN-<slug>.md` dari `.claude/modul/template/tugas.md` (≤ 100 baris):
   - `butir:` = K yang diwujudkan + `DATA`/`KONTRAK` bila menyentuhnya. **Aturan tidak disalin** (R5).
   - `file:` sempit (path persis/glob kecil). `tes:` path persis (tidak boleh glob).
   - Rujukan pola: path + bagian. Dilarang. Selesai bila: perintah persis.
   - Tidak bisa dirinci tanpa menebak → ada keputusan yang belum ada → baris K ⏳ + tanya (R9).
5. `node scripts/modul/cek.mjs <nnn>` harus 0 galat (kecuali galat "Bukti RED"/"test belum dikunci" yang memang tahap berikutnya).
6. Selesai. Ringkasan ditulis oleh file perintah `prd.md`.
