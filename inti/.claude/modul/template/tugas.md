---
no: 1
judul: <judul singkat>
butir: K1, DATA
file: <path persis atau glob kode yang boleh diubah pembangun>
tes: <path persis file test — dikunci setelah tahap tes>
bergantung:
status: rancang
---
## Tujuan
<1–3 kalimat. Aturan bisnis TIDAK disalin — baca butirnya di 03-keputusan.md (R5).>

## Kontrak
<rujuk bagian Kontrak di 04-rancangan.md, atau tulis tanda tangan khusus tugas ini sebagai kode>

## Rujukan pola
- `<path>` — <bagian yang ditiru>

## Dilarang
Ubah schema · tambah dependency · sentuh file di luar `file:` · ubah test · "sekalian merapikan".

## Selesai bila
`<perintah test tugas ini>` hijau · lint & tipe (`.claude/modul/proyek.md`) hijau.

## Bukti RED
(diisi Perancang Uji: output test yang gagal karena assertion — R12)

## Klarifikasi
(diisi saat build: pertanyaan → jawaban)

## Hasil
(diisi pembangun: model, output verifikasi asli, yang tidak dicek)
