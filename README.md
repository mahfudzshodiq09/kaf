# kaf

Workflow **`/kaf` v2** untuk membangun fitur dengan AI secara disiplin: Claude Code (Opus) merancang & memeriksa, DeepSeek/Gemini lewat 9router mengerjakan (DeepSeek menulis kode lewat Claude Code yang diarahkan ke 9router — tanpa OpenCode), pemilik memutuskan.
Satu sumber untuk semua project; tiap project memegang salinannya sendiri (agar penjaga & CI ikut ter-versi di repo project).

```
/kaf plan "ide"  →  /kaf prd 002  →  /kaf build 002 [1-10]  →  /kaf review 002
      BRD             ✍️ setujui BRD       ✍️ setujui PRD → kode      review + perbaikan + test
```

## Pakai

```bash
KAF=~/Documents/nextjs/kaf

node $KAF/bin/kaf.mjs install ~/Documents/nextjs/proyek-baru      # profil dideteksi: pnpm-workspace → monorepo-pnpm, selain itu nextjs-npm
node $KAF/bin/kaf.mjs update  ~/Documents/nextjs/pmb-univet        # ambil versi terbaru (berkas yang diubah lokal tidak ditimpa)
node $KAF/bin/kaf.mjs cek     ~/Documents/nextjs/{new_siakad,pmb-univet,siakad-uji}
```

Atau pasang perintah global sekali: `cd ~/Documents/nextjs/kaf && npm link` → `kaf update .`

`install`/`update` hanya dijalankan **pemilik** di terminal. Dari Claude Code ditolak, karena keduanya mengganti file penjaga.

## Isi repo

| Folder | Isi | Saat `update` |
|---|---|---|
| `inti/` | Script & penjaga, hook, pembangun (`bangun.mjs`), perintah `/kaf`, file tahap, prompt agent, template, dokumen desain, workflow CI | **Ditimpa**, kecuali berkas yang kamu ubah lokal (pakai `--paksa` untuk menimpanya) |
| `awal/` | `model.json`, `anti-slop.md`, `research.md`, `08-uji-kering.md` | Dipasang sekali, tidak pernah ditimpa |
| `profil/<nama>/` | `proyek.json` (folder kode), `proyek.md` (stack, perintah, sumber bisnis) | Dipasang sekali, tidak pernah ditimpa |
| `bin/kaf.mjs` | Installer | – |

Di project, installer juga:
- menggabungkan hook ke `.claude/settings.json`;
- menambah skrip `modul:*` di `package.json`;
- mengelola blok `<!-- kaf:mulai … kaf:selesai -->` di `CLAUDE.md`;
- mencatat versi + sidik jari berkas di `.claude/modul/kaf.json`.

## Mengembangkan kaf

1. Ubah berkas di `inti/`, lalu `npm test`. Isinya test installer + 38 test `/kaf`.
2. Naikkan `version` di `package.json`, lalu catat di `CHANGELOG.md`.
3. Commit & push, lalu `kaf update` di tiap project.

Dokumentasi workflow: [`inti/docs/modul-v2/README.md`](inti/docs/modul-v2/README.md).
