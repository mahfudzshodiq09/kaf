# /kaf rilis <nnn> · Opus

Syarat: butir UAT sah.

1. Tulis `07-rilis.md` (≤ 150 baris): catatan rilis (bahasa pengguna), panduan singkat per peran, aktivasi (feature flag) + cek masa beku (OBS-13), rollback (OBS-12), migrasi data bila ada.
2. Deploy production hanya lewat alur GIT-10 (manual, oleh pemilik).
3. Setelah aktif → pemilik: `node scripts/modul/setujui.mjs <nnn>` (butir RILIS). Usulkan (tanya dulu) keputusan lintas modul ke `docs/SPESIFIKASI-BISNIS.md`.
