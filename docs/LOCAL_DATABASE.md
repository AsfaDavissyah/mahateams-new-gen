# Local PostgreSQL Setup

Dokumen ini untuk menjalankan database preview lokal.

## 1. Install PostgreSQL

PostgreSQL 18 sudah terpasang melalui Chocolatey di:

```txt
C:\Program Files\PostgreSQL\18\bin
```

Jika terminal belum mengenali `psql`, tutup terminal lalu buka lagi. PATH user sudah ditambahkan ke folder `bin` tersebut.

Saat install, gunakan nilai yang sesuai dengan `.env` project:

```txt
User: postgres
Password: postgres
Port: 5432
Database: mahateams_new_gen
```

Jika installer tidak membuat database `mahateams_new_gen`, buat manual lewat pgAdmin.

Pada setup lokal ini, password user `postgres` sudah disamakan menjadi:

```txt
postgres
```

## 2. Cek `.env`

Pastikan `.env` berisi:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mahateams_new_gen?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_SECRET="replace-with-a-long-random-secret"
```

## 3. Push Schema ke Database

```bash
npm.cmd run db:generate
npm.cmd run db:push
```

## 4. Isi Data Preview

```bash
npm.cmd run db:seed
```

Seed akan membuat:

- Studio Mahative
- Studio Kipa
- Super Admin preview
- Admin Mahative preview
- Member Intern preview
- Policy presensi Mahative
- Jadwal kerja Selasa-Sabtu
- Placement lintas studio ke Kipa
- Contoh presensi WFH

## 5. Lihat Database

```bash
npm.cmd run db:studio
```

Prisma Studio akan terbuka di browser untuk melihat data lokal.
