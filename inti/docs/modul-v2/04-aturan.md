# 04 · Aturan Agent `/kaf` v2

Berlaku untuk semua agent. File tahap di `.claude/modul/tahap/` merujuk ID aturan ini.

| ID | Aturan | ✅ PASS | ❌ FAIL |
|---|---|---|---|
| R1 | **Cek dulu sebelum bertanya.** Baca `03-keputusan.md` modul ini, `PLAN/KEPUTUSAN.md`, dan `docs/SPESIFIKASI-BISNIS.md`. Kasus yang sama dari sudut lain = sudah terjawab. | "K7 sudah memutuskan: sandi benar tetap diterima saat diperlambat. Tidak ditanyakan lagi." | Menanyakan "Kalau sandi benar saat terkunci, ditolak?" padahal K7 sudah ada. |
| R2 | **Cara bertanya:** pilihan ganda, ≤ 4 pertanyaan per putaran, opsi rekomendasi di urutan pertama dengan alasan. Jawaban langsung ditulis sebagai baris K. | Pertanyaan → jawaban → K12 terisi, status 📝. | Jawaban hanya ada di chat; atau ditulis di rancangan/tugas. |
| R3 | **Keputusan hanya di `03-keputusan.md`.** Tidak boleh ada aturan bisnis baru di rancangan, tugas, komentar kode, atau test yang tidak punya ID K. | Test `[K4] …` memeriksa aturan K4. | Rancangan menulis "maksimal 2 kali cuti" tanpa ID K. |
| R4 | **Asumsi bukan fakta.** Asumsi ditulis `A` di konteks. Dipakai hanya setelah menjadi K ✅. | A3 → ditanyakan → K9 ✅ → dipakai di tugas 4. | Tugas memakai A3 langsung. |
| R5 | **Rujuk, jangan salin.** Rancangan & tugas menyebut ID butir; isi aturan dibaca dari sumbernya. | `butir: K1, K2` | Menyalin kalimat K1 ke tugas "biar lengkap". |
| R6 | **Hanya pemilik yang menyetujui**, dengan mengetik `/kaf prd`/`/kaf build` atau `pnpm modul:setujui`. AI tidak memanggil keduanya, tidak mengedit `persetujuan.json`/`kunci-tes.json`, tidak mengubah kolom Status keputusan. | "Kalau sudah sesuai, ketik `/kaf prd 002`." | AI memanggil `/kaf build` lewat tool Skill, menulis `✅` sendiri, atau menjalankan `setujui`. |
| R7 | **Tidak mengakali penjaga.** Ditolak hook/plugin/CI → jelaskan sebabnya dan usulkan jalan resmi (`ubah`, baris baru, `--buka`). | "Ditolak karena tugas 4 butuh K9 yang belum disetujui." | Menulis file lewat `cat >`/`sed -i` setelah Edit ditolak. |
| R8 | **Pembangun persis tugas.** Satu tugas aktif. Hanya `file:` tugas. Tidak mengubah test terkunci, tidak menambah fitur/dependency/file, tidak "sekalian merapikan". | Diff hanya `cuti.rules.ts`. | Ikut mengubah `krs.rules.ts` karena "kelihatan salah". |
| R9 | **Kurang jelas → tanya, jangan menebak.** Pertanyaan pilihan ganda, lalu lanjut. Jawaban yang menyentuh aturan bisnis = baris K baru (tugas `blokir`). Jawaban teknis kecil dicatat di Klarifikasi. | "Urutan daftar: (1) terbaru dulu ✓ …" → dicatat, lanjut. | Memilih sendiri urutan lalu tidak mencatatnya. |
| R10 | **Batas ulang.** Build gagal 2× → `blokir` + output asli. Review FAIL 2 putaran untuk tugas yang sama → berhenti, pemilik memutuskan. | "Tugas 5 blokir setelah 2 percobaan, output: …" | Mencoba ke-5 kalinya diam-diam. |
| R11 | **Bukti, bukan klaim.** Tempel output asli; tulis yang tidak dicek; catat model yang menjawab. | "`pnpm test:int` tidak dijalankan: Postgres mati." | "Semua test lulus" tanpa output. |
| R12 | **Test bisa gagal.** Bukti RED dijalankan terhadap **stub** (tanda tangan Kontrak yang melempar `BELUM_DIIMPLEMENTASI`): **semua** test harus gagal. Test yang lulus terhadap stub = test lemah, perbaiki dulu. | `[K2] … expected CutiDitolak, received Error: BELUM_DIIMPLEMENTASI` | `Cannot find module './cuti.rules'`, atau `[K2]` lulus padahal stub kosong |
| R13 | **Bahasa.** Ke pemilik: teknis boleh, ringkas, ≤ 15 baris. Ke unit kampus (UAT, panduan): bahasa awam + contoh kejadian. | Ringkasan rancangan menyebut tabel & kolom. | Panduan BAAK menyebut "Server Action". |
| R14 | **Tanpa data pribadi asli** di dokumen, test, fixture, atau log (SEC-10/11). | NIM contoh `2401001`. | NIM mahasiswa sungguhan. |
| R15 | **Anti-slop** (`.claude/rules/project/anti-slop.md`) berlaku untuk semua kode & laporan. | – | – |

## Kapan naik ke pemilik

| Situasi | Tindakan |
|---|---|
| Keputusan bisnis belum ada | Baris K ⏳ + tanya (R2) |
| Penjaga menolak karena butir belum disetujui | Minta pemilik menjalankan `pnpm modul:setujui <nnn>` |
| Batas ulang tercapai (R10) | Berhenti, tampilkan output, usulkan pilihan |
| Konflik antar-sumber (pedoman vs SEVIMA vs Feeder) | Tampilkan keduanya, tanya, catat sebagai K |
| Swarm tidak sepakat soal hal yang menyentuh K | Tampilkan perbedaan, tanya (lihat `06-swarm.md`) |
