# Langkah plan-2 — Konteks · Gemini (+ DeepSeek bila Besar) → Opus

Tujuan: fakta bersumber, asumsi, dan gap. **Bukan** keputusan.

1. Kumpulkan file bahan: `00-modul.md`, sumber referensi bisnis yang relevan dari `.claude/modul/proyek.md`, `docs/research/` terkait, `PLAN/KEPUTUSAN.md`. Total di bawah batas tanya-model; pilih yang relevan saja.
2. Jalankan (Besar: dua perintah paralel dengan `&` lalu `wait`):
   ```bash
   node scripts/modul/tanya-model.mjs --peran konteks --model gemini --masuk <file,…> --keluar PLAN/<m>/_swarm/konteks-gemini.md
   node scripts/modul/tanya-model.mjs --peran riset-teknis --model deepseek --masuk <00-modul + kode terkait> --keluar PLAN/<m>/_swarm/konteks-deepseek.md   # Besar
   ```
   - Gagal karena model belum diisi atau 9router mati → beri tahu pemilik (`docs/modul-v2/07-pemasangan.md`) dan kerjakan sendiri. Tulis "dikerjakan Opus, tanya-model tidak tersedia".
   - `⚠️ MODEL BERBEDA` → hasilnya jangan dipercaya, sebutkan ke pemilik.
3. Periksa hasilnya: **setiap fakta harus punya sumber yang bisa dicek**. Fakta tanpa sumber jadi Asumsi. Swarm: buat tabel Sepakat/Beda dulu (`06-swarm.md`).
4. Tulis `01-konteks.md` (≤ 250 baris) dari template. Riset panjang → `docs/research/YYYY-MM-DD-<topik>.md`, cukup dirujuk.
5. Setiap Gap & Asumsi yang menyentuh aturan bisnis → tambahkan baris di `03-keputusan.md` dengan Maka `⏳ <pertanyaan>` (R4). Cek R1 dulu: yang sudah diputuskan di `PLAN/KEPUTUSAN.md` cukup dirujuk, tidak ditanyakan.
6. Lanjut ke langkah solusi (bila ada alternatif nyata) atau keputusan.
