# MahaTeams New Gen

Aplikasi presensi web untuk Mahative Studio dan Kipa.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma
- PostgreSQL
- GitHub
- Vercel

## Folder Penting

```txt
src/app                 Halaman aplikasi Next.js
src/components/ui       Komponen shadcn/ui
src/lib                 Helper aplikasi
prisma/schema.prisma    Schema database PostgreSQL
docs/LOCAL_DATABASE.md  Panduan PostgreSQL lokal
docs/NEON_DATABASE.md   Panduan PostgreSQL online Neon
.env.example            Contoh environment variable
```

## Command Lokal

Di PowerShell Windows, gunakan `npm.cmd`.

```bash
npm.cmd run dev
npm.cmd run lint
npm.cmd run db:generate
npm.cmd run db:push
npm.cmd run db:seed
npm.cmd run db:studio
```

Jika memakai terminal lain, biasanya cukup:

```bash
npm run dev
npm run lint
npm run db:generate
npm run db:push
npm run db:studio
```

## Environment

Salin `.env.example` menjadi `.env`, lalu isi koneksi PostgreSQL.

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mahateams_new_gen?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_SECRET="replace-with-a-long-random-secret"
```

## Alur GitHub

```bash
git status
git add .
git commit -m "Initial app setup"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

## Alur Vercel

1. Buka Vercel.
2. Import repository GitHub project ini.
3. Isi environment variable, terutama `DATABASE_URL`.
4. Deploy.
5. Setiap push ke branch `main`, Vercel akan deploy ulang.

## Database

Untuk database baru:

```bash
npm.cmd run db:generate
npm.cmd run db:push
npm.cmd run db:seed
```

`db:push` akan membuat tabel berdasarkan `prisma/schema.prisma` ke database yang ada di `DATABASE_URL`.

Panduan lengkap database lokal ada di `docs/LOCAL_DATABASE.md`.

Untuk database online agar bisa dipakai dari banyak laptop dan Vercel, gunakan `docs/NEON_DATABASE.md`.
