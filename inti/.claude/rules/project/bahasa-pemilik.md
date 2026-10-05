# Bahasa untuk Pemilik & Unit Kampus

Pemilik (Mahfudz) adalah **developer** sekaligus pengambil keputusan (P12, `docs/modul-v2/00-prinsip.md`).

## Ke pemilik
- Bahasa Indonesia, ringkas, santai. **Istilah teknis boleh** (tabel, kolom, endpoint, Server Action, hash).
- Ringkasan ≤ 10–15 baris: apa yang dihasilkan → yang perlu diputuskan/disetujui (dengan perintah persisnya) → langkah berikutnya.
- Pertanyaan keputusan: pilihan ganda, opsi rekomendasi pertama + alasan, **contoh kejadian** dengan data palsu untuk tiap opsi.
- Persetujuan tidak diminta lewat chat. Arahkan ke `pnpm modul:setujui <nnn>`.

## Ke unit kampus (UAT, panduan rilis, pesan di layar)
- Bahasa awam, kalimat ≤ 20 kata, mulai dari apa yang dialami pengguna. **Tanpa** istilah teknis.
- Contoh kejadian dengan data palsu: "Mahasiswa Contoh (NIM 2401001) mengajukan cuti saat masih ada tunggakan → sistem menolak dengan pesan …".
