# /kaf uat <nnn> · Gemini menyusun, Opus memeriksa

Syarat: semua tugas `selesai`/`batal`, review mencakup kode terakhir (CI menolak bila tidak), sudah di staging.

1. `node scripts/modul/tanya-model.mjs --peran uat --model gemini --masuk PLAN/<m>/00-modul.md,PLAN/<m>/03-keputusan.md --keluar PLAN/<m>/_swarm/uat-gemini.md`
2. Opus memeriksa: setiap DoD & setiap K ✅ punya ≥ 1 skenario; bahasa awam (R13); data palsu (R14). Tulis `06-uat.md` (≤ 200 baris).
3. Pemilik menjalankan bersama unit di staging; hasil diisi di kolom Hasil. Temuan → bug kecil: `/ecc:orch-fix-defect`; aturan berubah: `/kaf ubah <nnn> <ID>`.
4. Semua lolos → pemilik: `node scripts/modul/setujui.mjs <nnn>` (butir UAT). Berikutnya: `/kaf rilis <nnn>`.
