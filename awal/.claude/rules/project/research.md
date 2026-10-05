# Hasil Riset

Semua hasil riset **wajib** disimpan ke file, tidak hanya di chat.

## Lokasi & nama

- `docs/research/YYYY-MM-DD-<topik-kebab-case>.md`

## Sumber untuk siakad (urutan prioritas)

| Sumber | Tag | Catatan |
|---|---|---|
| Pedoman Akademik Univet, SK Rektor | `[PERATURAN]` | Rujuk bab/pasal/halaman. |
| Permendikbudristek, UU PDP, aturan akreditasi | `[REGULASI]` | Rujuk nomor & pasal. |
| Dokumentasi Web Service Neo Feeder | `[FEEDER]` | Nama tabel/field Feeder boleh disebut di rancangan. |
| Wawancara unit (BAAK, keuangan, prodi, …) | `[KAMPUS]` | Tulis jabatan, bukan nama pribadi. |
| Perilaku SEVIMA — **akun demo saja** | `[SEVIMA]` | Pengamatan per halaman di `docs/sevima/` (aturan aman di `docs/sevima/README.md`). Daftar periksa, bukan acuan. Tidak mengambil data/halaman production. |
| Struktur hasil ekspor backup SEVIMA | `[EKSPOR]` | `docs/sevima/PETA-DATA-EKSPOR.md`. Hanya struktur; tiap kolom wajib punya keputusan. Baris data asli hanya di staging saat latihan migrasi (SEC-11). |
| Formulir, contoh dokumen, laporan | `[DOKUMEN]` | Data pribadi dihapus/disamarkan. |

## Pemilihan tool

| Scope | Tool |
|---|---|
| Kode di repo ini | agent `ecc:code-explorer` |
| API/versi library (Next, Prisma, Auth.js, zod, pg-boss, Xendit) | `ecc:docs-lookup` (Context7) |
| Paket siap pakai sebelum coding | `/ecc:search-first` |
| Regulasi / topik banyak sumber | `/ecc:deep-research` |
| Perbandingan vendor | `/ecc:market-research` |

Bila tool tidak tersedia → WebSearch/WebFetch, sebutkan keterbatasannya.

## Isi minimal

1. Pertanyaan / tujuan
2. Ringkasan temuan
3. Rekomendasi
4. Sumber (judul/URL + tanggal akses, atau bab/pasal)

## Setelah selesai

- Tulis ringkasan + path file di chat.
- Rujuk dari `01-konteks.md` modul terkait (jangan disalin).
- Jangan simpan kredensial, token, atau data pribadi asli.
