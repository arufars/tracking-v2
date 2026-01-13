"use client";

import type React from "react";
import { useActionState, useEffect } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { AlertCircle, ChevronLeftIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
// https://magicui.design/docs/components/particles
import { Particles } from "@/components/ui/particles";
import { registerEmail } from "@/server/auth-actions";

import LogoBintang from "../../media/logo-dreamlight.jpg";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";

export function AuthPageReg() {
  const [state, formAction, isPending] = useActionState(registerEmail, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard");
    }
  }, [state?.success, router]);

  return (
    <div className="relative w-full md:h-screen md:overflow-hidden">
      <Particles className="absolute inset-0" color="#666666" ease={20} quantity={120} />
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4">
        <Button asChild className="absolute top-4 left-4" variant="ghost">
          <a href="/">
            <ChevronLeftIcon />
            Kembali ke beranda
          </a>
        </Button>

        <div className="mx-auto space-y-4 sm:w-sm">
          {/* <Logo className="h-6" />
           */}
          <Image src={LogoBintang} alt="Logo Bintang" width={150} height={150} className="mx-auto block" />
          <div className="flex flex-col space-y-1">
            <h1 className="font-bold text-2xl tracking-wide">Register ke Dreamlight Production Tracking</h1>
            <p className="text-base text-muted-foreground">
              Akses progres produksi, keuangan, dan laporan sesuai peran Anda.
            </p>
          </div>

          {state?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="full_name" className="font-medium text-foreground text-sm dark:text-foreground">
                Name
              </Label>
              <Input
                type="text"
                id="full_name"
                name="full_name"
                autoComplete="name"
                placeholder="Nama Anda"
                className="mt-2"
                disabled={isPending}
                required
              />
            </div>
            <div>
              <Label htmlFor="email" className="font-medium text-foreground text-sm dark:text-foreground">
                Email
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                placeholder="anda@dreamlightworld.com"
                className="mt-2"
                disabled={isPending}
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="font-medium text-foreground text-sm dark:text-foreground">
                Password
              </Label>
              <Input
                type="password"
                id="password"
                name="password"
                autoComplete="new-password"
                placeholder="Minimal 6 karakter"
                className="mt-2"
                disabled={isPending}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="mt-4 w-full py-2 font-medium" disabled={isPending}>
              {isPending ? "Mendaftar..." : "Daftar ke sistem"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">atau</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button className="w-full" size="lg" type="button">
              <GoogleIcon />
              Masuk dengan Google Workspace
            </Button>
          </div>
          <p className="mt-8 text-muted-foreground text-sm">
            Dengan masuk, Anda menyetujui{" "}
            <a className="underline underline-offset-4 hover:text-primary" href="/terms-of-use">
              Syarat Penggunaan
            </a>{" "}
            dan{" "}
            <a className="underline underline-offset-4 hover:text-primary" href="/privacy-policy">
              Kebijakan Privasi
            </a>{" "}
            Dreamlight World Media.
          </p>
        </div>
      </div>
    </div>
  );
}

const GoogleIcon = (props: React.ComponentProps<"svg">) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <title>Google icon</title>
    <g>
      <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
    </g>
  </svg>
);
