import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth";
import { loginAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [currentUser, params] = await Promise.all([
    getCurrentUser(),
    searchParams,
  ]);

  if (currentUser) {
    redirect("/");
  }

  const hasError = params.error === "invalid";

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-6 py-10 text-zinc-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Badge variant="outline" className="w-fit bg-white">
            MahaTeams New Gen
          </Badge>
          <CardTitle>Login Dashboard</CardTitle>
          <CardDescription>
            Masuk sebagai Admin atau Member untuk membuka dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin.mahative@mahateams.local"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Masukkan password"
                required
              />
            </div>
            {hasError ? (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                Email atau password tidak sesuai.
              </p>
            ) : null}
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>

          <div className="mt-5 rounded-md bg-zinc-100 p-3 text-xs text-zinc-600">
            <p className="font-medium text-zinc-800">Akun preview lokal</p>
            <p>Admin: admin.mahative@mahateams.local / admin123</p>
            <p>Member: member@mahateams.local / member123</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
