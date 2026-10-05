# Profil Project — <nama>

<Satu kalimat: aplikasi apa, untuk siapa.>

## Stack
Monorepo pnpm + Turborepo · Next.js App Router · PostgreSQL + Prisma · <UI> · Vitest (unit/integrasi) · Playwright (e2e).

## Struktur kode
`apps/<app>/src/…` · paket bersama `packages/…` · <pola modul/folder yang dipakai>.

## Aturan teknis
<dokumen aturan teknis project, mis. ARCHITECTURE.md, docs/adr/, docs/tech-spec/ — rujuk ID bila ada>

## Perintah verifikasi
| Cek | Perintah |
|---|---|
| Lint & tipe | `pnpm lint && pnpm typecheck` |
| Unit | `pnpm test --filter <paket>` |
| Integrasi (DB) | `pnpm test:int --filter <paket>` |
| E2E | `pnpm e2e --filter <app>` |
| Build | `pnpm build --filter <app>` |

## Sumber referensi bisnis (urut prioritas)
<mis. pedoman/peraturan `[PERATURAN]` · wawancara unit `[KAMPUS]` · sistem luar `[FEEDER]` · `docs/research/` · `docs/SPESIFIKASI-BISNIS.md`>

## Larangan khusus
<mis. perubahan database hanya lewat prisma migrate · tanpa dependency baru tanpa izin>
