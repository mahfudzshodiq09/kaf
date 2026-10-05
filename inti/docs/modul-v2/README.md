# `/modul` v2: Panduan

Workflow pengembangan modul new_siakad dengan AI. Pengganti `/modul` v1 (diarsipkan di `arsip-v1/`).

| Dokumen | Isi |
|---|---|
| `.claude/modul/proyek.md` · `proyek.json` | **Profil project**: stack, perintah, sumber bisnis · folder kode yang dijaga. Satu-satunya bagian yang beda antar project (new_siakad, pmb-univet) |
| [00-prinsip](00-prinsip.md) | 12 prinsip dasar: rujukan bila ragu |
| [01-alur](01-alur.md) | Tahap, perintah, ukuran modul, ukuran berhasil |
| [02-agen](02-agen.md) | 10 agent: model, input/output, wewenang, kapan berhenti |
| [03-artifact](03-artifact.md) | Format & batas setiap file |
| [04-aturan](04-aturan.md) | Aturan agent R1–R15 + contoh PASS/FAIL |
| [05-gate](05-gate.md) | Persetujuan per butir & penjaga |
| [06-swarm](06-swarm.md) | Kapan & cara memakai banyak model |
| [07-pemasangan](07-pemasangan.md) | Langkah pemasangan di Mac (9router, OpenCode, CI) |
| [08-uji-kering](08-uji-kering.md) | Hasil uji kering & checklist pilot |

## Sehari-hari

```bash
# Claude Code — empat perintah utama
/modul plan "pengajuan cuti akademik"   # → BRD (tanya-jawab pilihan ganda)
/modul prd 002                          # setujui BRD → PRD
/modul build 002                        # setujui PRD → kode semua tugas (atau: /modul build 002 1-5)
/modul review 002                       # review + perbaikan + test lengkap sampai lulus

/modul 002                              # lupa langkah berikutnya? ini jawabannya
/modul uat 002 · /modul rilis 002       # akhir modul

# Terminal (pemilik)
pnpm modul:setujui 002                  # UAT/RILIS, atau cadangan persetujuan
pnpm modul:list                         # progres semua modul
```
