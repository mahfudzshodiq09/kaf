# 00 · Prinsip `/kaf` v2

Patokan untuk semua keputusan desain v2. Bila ada aturan, script, atau template yang bertentangan dengan prinsip ini, yang salah adalah aturannya.

| # | Prinsip | Contoh |
|---|---|---|
| P1 | **Satu sumber keputusan.** Semua aturan bisnis ada di `03-keputusan.md`. Dokumen lain hanya merujuk ID-nya, tidak menyalin isinya. | Tugas menulis `butir: K3`, bukan menyalin kalimat "cuti maksimal 2 semester". |
| P2 | **Persetujuan per butir, bukan per dokumen.** Butir = satu baris keputusan, bagian Data, bagian Kontrak, UAT, Rilis. Yang berubah saja yang disetujui ulang. | K7 diubah → hanya K7 yang disetujui ulang, hanya tugas yang memakai K7 yang tertahan. |
| P3 | **Bertanya sekali.** Sebelum bertanya, AI wajib memeriksa keputusan yang sudah ada. Kasus yang sama dengan sudut pandang berbeda tetap dianggap pertanyaan yang sama. Kasus baru dicatat sebagai baris baru. | "Kalau terkunci, sandi benar diterima?" dan "Kalau sandi benar saat terkunci, ditolak?" = satu pertanyaan. |
| P4 | **Persetujuan dibuktikan mekanisme, bukan janji.** Hanya bisa dilakukan pemilik di terminal interaktif (`pnpm modul:setujui`). AI tidak bisa menjalankannya. | Riwayat tidak akan pernah lagi berisi "`--setujui` … Oleh: AI". |
| P5 | **Test adalah spesifikasi.** Model kuat menulis test yang masih gagal sebelum build. Test lalu dikunci, dan pembangun hanya membuatnya lulus. | Kartu tugas tidak lagi berisi ratusan baris aturan. Aturannya ada di test. |
| P6 | **Model sesuai peran, dan selalu tercatat.** Opus merancang dan memeriksa, Gemini membaca dan merangkum, DeepSeek mengerjakan. Nama model yang benar-benar menjawab dicatat di setiap hasil. | Header hasil: `dijawab=deepseek-v4-flash`. |
| P7 | **Dokumen kecil dan berbatas.** Setiap artifact punya batas ukuran, dicek otomatis. | Rancangan ≤ 400 baris, tugas ≤ 100 baris. |
| P8 | **Satu tugas aktif, satu commit, file sesuai tugas.** Dicek per commit di CI, bukan gabungan. | Commit bertrailer `Tugas: 3` hanya boleh menyentuh file milik tugas 3. |
| P9 | **Asumsi bukan fakta.** Konteks memisahkan fakta bersumber dan asumsi. Asumsi baru boleh dipakai setelah menjadi baris keputusan ✅. | A2 "pembayaran sinkron" → ditanyakan → K9 ✅ → baru dipakai. |
| P10 | **Proses sesuai risiko.** Kecil di luar `/kaf`, Sedang ringkas, Besar memakai swarm. | Ganti label → `/ecc:orch-change-feature`. Aturan kelulusan → Besar. |
| P11 | **Jujur dan berbukti.** Anti-slop tetap berlaku. Output asli ditempel, dan yang tidak dicek ditulis. | "Test integrasi tidak dijalankan: Postgres tidak tersedia." |
| P12 | **Pemilik adalah developer.** Ke pemilik boleh memakai bahasa teknis yang ringkas. Bahasa awam hanya untuk unit kampus (UAT, panduan rilis). | Ringkasan untuk pemilik boleh menyebut tabel, kolom, dan endpoint. |

## Bukan tujuan v2

- Framework untuk publik.
- Orkestrator baru (LangGraph dan sejenisnya). Ditunda sampai ada pemicu di `06-swarm.md`.
- Menambah dokumen. Jumlah total teks per modul harus jauh lebih kecil daripada v1.
