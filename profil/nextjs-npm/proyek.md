# Profil Project — <nama>

<Satu kalimat: aplikasi apa, untuk siapa.>

## Stack
Next.js (App Router) + React + TypeScript · Prisma + PostgreSQL · <auth> · Zod · <UI> · Vitest (unit + integration) · Playwright (e2e).

## Struktur kode
- `src/app/…` halaman & API route (route hanya boundary)
- `src/lib/<domain>.ts` domain logic · `src/lib/validations/` skema Zod
- `prisma/schema.prisma` · `tests/unit`, `tests/integration`, `tests/e2e`

## Aturan teknis
`CLAUDE.md` (aturan wajib) · <dokumen teknis lain>

## Perintah verifikasi
| Cek | Perintah |
|---|---|
| Lint & tipe | `npm run lint && npx tsc --noEmit` |
| Unit | `npm run test:unit` |
| Integrasi (DB) | `npm run test:integration` |
| E2E | `npm run test:e2e` |
| Build | `npm run build` <sesuaikan bila build menyentuh database> |

## Sumber referensi bisnis (urut prioritas)
`docs/SPESIFIKASI-BISNIS.md` · <peraturan `[PERATURAN]` · wawancara `[KAMPUS]` · dokumentasi sistem luar `[DOKUMEN]`> · `docs/research/`

## Larangan khusus
<perintah yang tidak boleh dijalankan, aturan schema, data sensitif yang tidak boleh di-log>
