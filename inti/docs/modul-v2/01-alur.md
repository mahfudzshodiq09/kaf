# 01 · Alur `/kaf` v2

Empat perintah utama. **Mengetik perintah berikutnya = menyetujui hasil perintah sebelumnya** (dicatat hook, bukan AI).

```
/kaf plan "ide" ──► BRD ──► /kaf prd 002 ──► PRD ──► /kaf build 002 [1-10] ──► kode ──► /kaf review 002 ──► lulus
   Opus (+Gemini)            ✍️ = setujui BRD    Opus     ✍️ = setujui PRD            Opus→DeepSeek            Opus⇄DeepSeek
```

| Perintah | Yang terjadi (otomatis berantai) | Hasil | Persetujuan |
|---|---|---|---|
| `/kaf rangkum [slug]` | Di akhir chat brainstorming: rangkuman (diputuskan / masih terbuka) | `PLAN/_ide/<slug>.md` | – |
| `/kaf plan "<ide>"` atau `/kaf plan PLAN/_ide/<slug>.md` | mulai → konteks (Gemini via tanya-model) → solusi (bila ada alternatif) → wawancara keputusan (pilihan ganda) | **BRD** = `00-modul` + `01-konteks` + `03-keputusan` (tabel Kalau → Maka) | – |
| `/kaf plan <nnn> [catatan]` | Revisi BRD / isi ⏳ | BRD diperbarui (✏️ = baris baru/berubah) | – |
| `/kaf prd <nnn> [catatan]` | Rancang Data, Kontrak, tugas | **PRD** = `04-rancangan` + `tugas/NN-*.md` | Mengetiknya = **setujui BRD** (semua K terisi) |
| `/kaf build <nnn> [3 \| 1-10 \| 1,3] [--opus]` | Per tugas: Opus menulis test + stub → merah → kunci → DeepSeek (`bangun.mjs`, Claude Code via 9router) membuat hijau → commit. Blokir ditanyakan di akhir | Kode + commit `Tugas: N` | Mengetiknya = **setujui PRD** (K, DATA, KONTRAK terisi) |
| `/kaf review <nnn>` | Periksa tugas sejak review terakhir + test lengkap modul → temuan serius diperbaiki DeepSeek → periksa ulang (maks 2×/tugas) → cap | `05-review.md` | – |
| `/kaf uat <nnn>` · `/kaf rilis <nnn>` | Skenario UAT (Gemini, bahasa awam) · catatan rilis | `06-uat`, `07-rilis` | `pnpm modul:setujui <nnn>` di terminal |

Lainnya: `/kaf <nnn>` (perintah berikutnya), `/kaf status <nnn>`, `/kaf daftar`, `/kaf ubah <nnn> <ID>`, `/kaf bantuan`. Terminal `pnpm modul:setujui <nnn>` tetap bisa dipakai untuk menyetujui butir apa pun.

## Testing & review: per tugas atau per modul?

| Apa | Kapan | Oleh |
|---|---|---|
| Test **tugas itu** (unit/integrasi/e2e di `tes:`) + lint + typecheck | **Per tugas**, di dalam `build`. Tugas tidak bisa `selesai` sebelum hijau | DeepSeek (dicek ulang Opus) |
| **Review kode** (kepatuhan tugas, keamanan, DB, anti-slop) | **Per putaran `review`**: semua tugas yang dibangun sejak review terakhir | Opus |
| **Test lengkap modul** (`test`, `test:int`, `e2e`, `build`) | Per putaran `review` | Opus |

Saran ritme: `build` satu kelompok (± 5 tugas atau diff ≤ 400 baris, GIT-04) → `review` → kelompok berikutnya. Tugas berisiko (migrasi, `*.rules.ts` uang/nilai, auth) sebaiknya kelompok sendiri.

## Kasus baru di tengah jalan

Kasus yang belum diputuskan bisa saja baru ketahuan saat rancang, tes, atau build. Penanganannya:

1. Tambah **baris baru** di `03-keputusan.md` dengan Maka `⏳ <pertanyaan>`. Baris lama tidak diubah.
2. Tanya pemilik (pilihan ganda), lalu isi Maka dengan jawabannya. Belum sah sampai pemilik mengetik `/kaf build <nnn> <no>` (atau `pnpm modul:setujui`).
3. Tugas yang butuh baris itu ditambah `butir:`-nya dan berstatus `blokir`. **Tugas lain jalan terus.**

## Ukuran modul

| Ukuran | Ciri | Jalur |
|---|---|---|
| Kecil | Label, filter, tampilan, bug, refactor. Tanpa keputusan bisnis dan tanpa perubahan database | **Bukan `/kaf`** → `/ecc:orch-*`, branch non-modul, label PR `non-modul` |
| Sedang | Fitur baru, tanpa uang, nilai, atau data pribadi sensitif | Semua tahap, 1 model per tahap, tahap 2 boleh dilewati |
| Besar | Nilai, kelulusan, uang, data pribadi, laporan PDDikti, banyak modul | Semua tahap + swarm di 1, 2, 7 (lihat `06-swarm.md`) |

## Ukuran berhasil (diukur di pilot)

| Ukuran | Target |
|---|---|
| Persetujuan ulang karena revisi | ≤ 1 kali per butir |
| Pertanyaan berulang untuk kasus yang sama | 0 |
| `04-rancangan.md` | ≤ 400 baris |
| Tugas yang lolos review tanpa ditulis ulang | ≥ 80% |
| Tugas dikerjakan model murah | ≥ 80% |
