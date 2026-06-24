# Neon Database Setup

Gunakan Neon sebagai PostgreSQL online agar project bisa dipakai dari banyak laptop dan Vercel.

## 1. Buat Project Neon

1. Buka Neon.
2. Create project.
3. Pilih nama project, misalnya `mahateams-new-gen`.
4. Setelah database dibuat, buka menu **Connect**.

## 2. Ambil Connection String

Ambil dua connection string:

```env
# Pooled connection untuk aplikasi Next.js/Vercel
DATABASE_URL="postgresql://USER:PASSWORD@EP-pooler.REGION.aws.neon.tech/DBNAME?sslmode=require&channel_binding=require"

# Direct connection untuk Prisma CLI
DIRECT_URL="postgresql://USER:PASSWORD@EP.REGION.aws.neon.tech/DBNAME?sslmode=require"
```

`DATABASE_URL` memiliki `-pooler` di hostname. `DIRECT_URL` tidak memiliki `-pooler`.

## 3. Isi `.env`

Ganti isi `.env` lokal dengan connection string Neon:

```env
DATABASE_URL="...-pooler...?sslmode=require&channel_binding=require"
DIRECT_URL="..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_SECRET="ganti-dengan-random-secret-panjang"
```

## 4. Push Schema dan Seed

```bash
npm.cmd run db:generate
npm.cmd run db:push
npm.cmd run db:seed
```

Setelah ini database Neon akan punya tabel dan data preview.

## 5. Set Vercel Environment Variables

Di Vercel Project Settings, tambahkan untuk Production dan Preview:

```env
DATABASE_URL="..."
DIRECT_URL="..."
AUTH_SECRET="..."
NEXT_PUBLIC_APP_URL="https://nama-project.vercel.app"
```

Setelah environment variable ditambahkan, redeploy project.
