# 06 · Swarm `/kaf` v2

Swarm = beberapa model mengerjakan **pertanyaan yang sama dari sudut berbeda**, lalu Opus menggabungkannya. Gunanya untuk menangkap titik buta, bukan mengulang kerja.

## Kapan dipakai

| Tahap | Sedang | Besar |
|---|---|---|
| 1 Konteks | Gemini saja | Gemini (domain) + DeepSeek (teknis) |
| 2 Solusi | Opus saja | Gemini (operasional/pengguna) + DeepSeek (implementasi) + Opus (arsitektur) |
| 4 Rancang | Opus saja | Draf BE (DeepSeek) + draf FE (Gemini) → Opus |
| 5 Tes | Opus (+ Gemini kasus tepi bila tugas `*.rules.ts`) | Opus + Gemini kasus tepi untuk semua tugas |
| 7 Review | Opus saja | Gemini (QA/skenario) + DeepSeek (kode) + Opus (arsitektur, keputusan akhir) |
| 6 Build | **Tidak pernah** | **Tidak pernah** |

## Protokol

1. **Paralel:** Opus menjalankan tanya-model untuk setiap sudut sekaligus (`&` lalu `wait`). Keluaran ke `PLAN/<m>/_swarm/<tahap>-<peran>.md`.
2. **Input sama:** semua anggota swarm mendapat file input yang sama. Yang beda hanya prompt perannya.
3. **Gabung (Opus):** buat tabel **Sepakat / Beda / Hanya disebut satu** sebelum menulis artifact.
4. **Konflik:**

   | Jenis beda | Tindakan |
   |---|---|
   | Fakta (sumber berbeda) | Cek sumbernya. Bila tetap beda → tampilkan ke pemilik, catat sebagai K |
   | Penilaian teknis | Opus memutuskan + alasan di artifact |
   | Menyentuh aturan bisnis | **Tanya pemilik** → baris K |
5. **Gagal/timeout:** tanya-model mencoba ulang 1×, timeout 5 menit. Masih gagal → lanjut tanpa sudut itu dan **tulis** "sudut X tidak tersedia" di artifact.
6. **Batas biaya:** maksimal 1 putaran swarm per tahap. Swarm ulang hanya atas permintaan pemilik.
7. **Model berbeda:** bila 9router menjawab dengan model lain (fallback), tanya-model memberi tanda `⚠️ MODEL BERBEDA`. Opus memperlakukan hasil itu sebagai **tidak dipercaya** dan menyebutkannya.

## Orkestrator

Swarm dijalankan oleh **Claude Code (Opus) + tanya-model + file**. Belum ada LangGraph.

Pertimbangkan orkestrator khusus (LangGraph, dll.) bila **salah satu** ini terjadi:

1. Ada developer lain dan beberapa modul berjalan paralel setiap hari.
2. Perlu alur berjalan sendiri tanpa ditunggui (semalaman), lengkap dengan retry dan ingatan state.
3. Swarm lewat command sering gagal atau sulit dilacak (lebih dari ~20% putaran bermasalah dalam sebulan).
