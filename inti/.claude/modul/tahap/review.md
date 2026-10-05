# /modul review · Opus memeriksa, DeepSeek memperbaiki, sampai lulus

Memeriksa **semua tugas yang dikerjakan sejak review terakhir** (satu putaran = satu rentang build), lalu menjalankan test lengkap modul. Pemeriksa tidak menulis kode aplikasi; perbaikan dikerjakan DeepSeek.

## 1. Siapkan
- Tidak boleh ada perubahan kode yang belum di-commit (`git status`). `05-review.md` belum ada → buat dari template.
- Rentang = dari "Direview sampai" (belum ada → titik cabang dengan `main`) sampai HEAD. Tugas = commit bertrailer `Tugas: N` di rentang itu + tugas berstatus `perbaikan`.

## 2. Periksa per tugas (diff commit-nya saja)
- File hanya `file:` + "selalu boleh"? Test terkunci utuh (`cek.mjs`)? Dependency baru → **HIGH** kecuali ada K yang mengizinkan (STK-05).
- Kontrak persis `## Kontrak`? Perilaku sesuai butir K, tidak lebih (R3/R8)? Klarifikasi tidak menyentuh aturan bisnis?
- Hasil memuat model, output asli, yang tidak dicek (R11)?
- Review kode: `/ecc:code-review` + kondisional `ecc:security-reviewer` (auth, uang, upload, data pribadi), `ecc:database-reviewer` (schema/query), `ecc:react-reviewer` (komponen), `ecc:silent-failure-hunter`.
  Besar: tambah paralel `tanya-model --peran periksa-qa --model gemini` & `--peran periksa-kode --model deepseek` (bahan: `git diff <rentang> > PLAN/<m>/_swarm/diff.txt`, file tugas, `03-keputusan.md`).

## 3. Test lengkap modul
Perintah di `.claude/modul/proyek.md`: lint & tipe · unit · integrasi (bila menyentuh DB) · e2e (bila mengubah alur) · build.
Tidak bisa dijalankan → tulis **tidak dicek** + alasan (jangan dianggap lulus). Gagal → temuan untuk tugas penyebabnya.

## 4. Tulis putaran di `05-review.md` lalu perbaiki otomatis
- **CRITICAL/HIGH** → `node scripts/modul/status.mjs <nnn> <no> perbaikan "<temuan>"` → DeepSeek (timeout 600000 ms):
  ```bash
  opencode run --agent pembangun "Mode otomatis. Perbaiki tugas <no> modul <nnn>: temuannya ada di PLAN/<m>/05-review.md (putaran terakhir). Test terkunci — perbaiki kodenya saja, lalu selesaikan sesuai prosedurmu."
  ```
  Lalu periksa ulang **hanya** diff perbaikan itu + test terkait (ulang langkah 2–3 untuk tugas itu).
- Temuan yang **tidak tertangkap test** yang ada → tambah test dulu: `kunci-tes.mjs <nnn> <no> --buka "<temuan>"` → `langkah/tes.md` (test baru harus merah) → baru DeepSeek memperbaiki.
- **Batas: 2 putaran perbaikan per tugas.** Masih FAIL → berhenti, tanya pemilik (AskUserQuestion: perbaiki manual / ubah tugas / terima sebagai utang).
- Temuan yang butuh keputusan bisnis → baris K baru, tugas `blokir`, minta pemilik `/modul build <nnn> <no>` setelah menjawab.
- **MEDIUM/LOW** → "Utang kecil" (tidak membuka tugas).

## 5. Tutup
Semua tugas di rentang PASS dan test lengkap hijau → commit `05-review.md` → `node scripts/modul/review.mjs <nnn>` (cap) → commit cap.

## Ringkasan akhir (≤ 15 baris)
`| No | Hasil (PASS/diperbaiki n×/FAIL) | Temuan utama |` + hasil test lengkap (asli) + utang kecil + yang tidak dicek. Penutup:
> Semua lulus → berikutnya **`/modul uat <nnn>`** (atau build tugas berikutnya: `/modul build <nnn> <rentang>`).
