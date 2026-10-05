# 02 · Agent `/modul` v2

10 agent. "Dijalankan lewat" menunjukkan cara memanggilnya:

- **Claude Code**: sesi utama yang menjalankan `/modul`.
- **tanya-model**: `node scripts/modul/tanya-model.mjs` → 9router.
- **OpenCode**: agent `pembangun`.

Prompt untuk agent non-Opus ada di `.claude/modul/agen/`.

| # | Agent | Model | Dijalankan lewat | Input | Output | Boleh mengubah | STOP bila |
|---|---|---|---|---|---|---|---|
| 1 | Penggali Konteks | Gemini | tanya-model `konteks` | `00-modul.md`, sumber (pedoman, `docs/sevima/`, Feeder, `docs/research/`) | Draf fakta, asumsi, gap | Hanya file keluaran | Sumber habis; konflik antar-sumber ditandai, tidak dipilih sendiri |
| 2 | Periset Teknis *(Besar)* | DeepSeek | tanya-model `riset-teknis` | `00-modul.md`, kode terkait, tech spec | Dampak teknis, pola yang bisa dipakai ulang | Hanya file keluaran | Pertanyaan terjawab atau ditandai ⏳ |
| 3 | Analis | Opus | Claude Code | Draf 1–2 | `01-konteks.md` final, `02-solusi.md` | `01`, `02` | Gap bisnis → baris ⏳; solusi → **selalu** berhenti, pemilik memilih |
| 4 | Pewawancara | Opus | Claude Code | `01`, `02`, `PLAN/KEPUTUSAN.md`, `docs/SPESIFIKASI-BISNIS.md` | `03-keputusan.md` | `03` (kecuali kolom Status) | Tidak ada ⏳ tersisa yang dibutuhkan; lalu pemilik menyetujui di terminal |
| 5 | Perancang | Opus (Besar: + draf BE dari DeepSeek, FE dari Gemini) | Claude Code (+ tanya-model `rancang-be`/`rancang-fe`) | `03` ✅, tech spec, ADR, kode | `04-rancangan.md`, `tugas/NN-*.md` | `04`, `tugas/` | Ada tugas yang tidak bisa dirinci tanpa menebak → baris keputusan baru |
| 6 | Perancang Uji | Opus (+ Gemini usul kasus tepi) | Claude Code (+ tanya-model `kasus-tepi`) | Tugas `rancang`, butir ✅ | File test merah, stub kontrak, bukti RED, `kunci-tes` | File di `tes:` + stub di `file:` | Setiap butir tugas punya ≥ 1 test bernama `[ID]`; test merah karena **assertion**, bukan karena modul tidak ada |
| 7 | Pembangun | DeepSeek | OpenCode agent `pembangun` (dipanggil `/modul build` lewat `opencode run`, atau manual `/build`) | **Satu** file tugas `siap` + test-nya + rujukan pola | Kode, commit `Tugas: N`, bagian Hasil | Hanya `file:` tugas (test terkunci) | Test hijau → `selesai`; gagal 2× → `blokir`; kurang jelas → tanya pilihan ganda |
| 8 | Pemeriksa | Opus (Besar: + Gemini QA, DeepSeek kode) | Claude Code (+ tanya-model `periksa-qa`/`periksa-kode`) | Diff per tugas, file tugas, butir | `05-review.md`, cap review | `05`, status tugas | FAIL → tugas `perbaikan` (maks 2 putaran per tugas, lalu pemilik) |
| 9 | Penyusun UAT | Gemini, diperiksa Opus | tanya-model `uat` | `03` ✅, `00` DoD | `06-uat.md` (bahasa awam) | `06` | Setiap DoD & butir K punya skenario |
| 10 | Penjaga Rilis | Opus | Claude Code | Semua artifact, CI, UAT | `07-rilis.md` | `07` | **Selalu** berhenti, pemilik yang merilis |

## Yang sengaja tidak ada

- **Planner FE, BE, dan Infra sebagai agent terpisah untuk setiap modul.** Untuk modul Sedang, Opus merancang sendiri. Pemisahan hanya dipakai untuk modul Besar, dalam bentuk draf dari tanya-model.
- **Agent yang "memperbaiki test supaya lulus".** Test hanya bisa dibuka lagi oleh Perancang Uji (`kunci-tes --buka`), dengan alasan tertulis.
- **Swarm untuk coding.** 1 worker → 1 tugas → 1 kepemilikan file.

## Pembagian biaya (perkiraan kasar)

| Model | Porsi kerja | Bayar lewat |
|---|---|---|
| Opus | Merancang, menulis test, memeriksa | Langganan Claude (di Claude Code) |
| DeepSeek | Semua kode produksi | 9router |
| Gemini | Membaca sumber, kasus tepi, UAT, QA | 9router |
