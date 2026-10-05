# 07 · Pemasangan `/modul` v2 (lewat kaf)

## 1. Pasang / perbarui

```bash
node ~/Documents/nextjs/kaf/bin/kaf.mjs install .     # project baru
node ~/Documents/nextjs/kaf/bin/kaf.mjs update .      # project yang sudah memakai kaf
```

✅ Di akhir tampil `tes /modul: 38/38 lulus`.

## 2. Lengkapi milik project (sekali)

- `.claude/modul/proyek.md`: stack, struktur kode, perintah verifikasi, sumber referensi bisnis, larangan khusus.
- `.claude/modul/proyek.json`: folder kode yang dijaga (`kode`) dan file yang selalu boleh diubah (`selaluBoleh`).
- `.claude/modul/model.json` dan `opencode.json`: nama model **tetap** Gemini & DeepSeek di 9router (`curl -s http://localhost:20128/v1/models`).

Semua file ini file penjaga, jadi edit sendiri di editor, bukan lewat AI.

## 3. Cek koneksi 9router

```bash
node scripts/modul/tanya-model.mjs --peran konteks --model gemini --masuk README.md --keluar .uji-9router.md
head -3 .uji-9router.md && rm .uji-9router.md     # ✅ dijawab=<nama gemini>, tanpa ⚠️ MODEL BERBEDA
```

## 4. Claude Code (buka ulang supaya hook termuat)

- Minta AI mengubah `.claude/settings.json` → ✅ ditolak `[gate-modul] … file penjaga`.
- `/modul bantuan` → ✅ tabel perintah.
- Uji persetujuan lewat ketikan:
  1. `node scripts/modul/baru.mjs uji-ketik`
  2. Isi satu baris K di `03-keputusan.md` modul itu.
  3. **Ketik** `/modul prd <nnn>` → ✅ `persetujuan.json` berisi K1 `oleh: "… (mengetik /modul prd)"`.
  4. Hapus folder modul uji sesudahnya.

  Tidak terbentuk? Jalankan `claude --debug`, lalu cek log `UserPromptExpansion`. Cadangannya: `node scripts/modul/setujui.mjs <nnn>`.

## 5. OpenCode

`opencode` → `/models` → ✅ ada "9router (lokal)" → agent **pembangun** → minta mengubah `scripts/modul/lib.mjs` → ✅ ditolak.

## 6. GitHub (bila project memakai GitHub Actions)

Label `non-modul` dan `perawatan-modul`. Branch protection `main`: wajib check `modul-gate / gate`.
PR yang mengubah file penjaga (termasuk hasil `kaf update`) diberi label `perawatan-modul`.

## Mode perawatan

`MODUL_PERAWATAN=1 claude`: AI boleh mengubah file penjaga di sesi ini saja.
