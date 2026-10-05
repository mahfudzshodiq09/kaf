# Langkah plan-3 — Solusi · Opus (+ swarm bila Besar)

Hanya bila ada **alternatif nyata** (alur, model data, atau pembagian peran yang berbeda). Sedang tanpa alternatif → lewati, tulis alasannya satu baris di `01-konteks.md`.

1. Besar: jalankan paralel, keluaran ke `_swarm/solusi-*.md`:
   ```bash
   node scripts/modul/tanya-model.mjs --peran solusi-operasional --model gemini   --masuk PLAN/<m>/00-modul.md,PLAN/<m>/01-konteks.md --keluar PLAN/<m>/_swarm/solusi-gemini.md &
   node scripts/modul/tanya-model.mjs --peran solusi-implementasi --model deepseek --masuk PLAN/<m>/00-modul.md,PLAN/<m>/01-konteks.md --keluar PLAN/<m>/_swarm/solusi-deepseek.md &
   wait
   ```
2. Opus menambah sudut arsitektur, lalu menulis `02-solusi.md` (≤ 120 baris): 2–3 opsi, untung/rugi, dampak data & peran, rekomendasi beralasan (rujuk F/G).
3. Tanya pemilik **satu** pertanyaan pilihan ganda: opsi mana. Jawaban → baris K baru di `03-keputusan.md` (Sumber `[PEMILIK]`).
4. Lanjut ke langkah keputusan.
