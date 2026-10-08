# Keputusan Bisnis

Aturan bisnis diputuskan pemilik (bersama unit kampus), **tidak** diasumsikan AI. Rinciannya ada di `docs/modul-v2/04-aturan.md` R1–R4. Ringkasnya:

- **Satu tempat:** setiap keputusan modul = satu baris `K` di `PLAN/<modul>/03-keputusan.md` (Kalau → Maka + sumber). Tidak di tempat lain (P1).
- **Cek dulu, tanya sekali (R1):** sebelum bertanya baca `03-keputusan.md`, `PLAN/KEPUTUSAN.md` (lintas modul, dibangkitkan), `docs/SPESIFIKASI-BISNIS.md`. Kasus yang sama dari sudut lain = sudah terjawab.
- **Cara tanya (R2):** `AskUserQuestion`/`question`, ≤ 4 per putaran, pilihan ganda, rekomendasi pertama + alasan bersumber (Pedoman Akademik, SEVIMA demo, Feeder, `docs/research/`).
- Wajib dipertimbangkan: wajib/opsional · kalender akademik · siapa boleh melihat/mengubah (peran & cakupan, UU PDP) · beda per periode/prodi/angkatan · dampak ke kelulusan/biaya/PDDikti.
- Belum terjawab → Maka `⏳ …`; tugas yang memakainya tertahan otomatis.
- Pekerjaan di luar `/kaf` (`/ecc:orch-*`) yang menemukan keputusan bisnis → berhenti, sarankan modul atau baris K di modul terkait.
- Tanpa data pribadi asli narasumber/mahasiswa.
