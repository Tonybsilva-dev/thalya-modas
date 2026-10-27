"use client";
import { BrandMark } from "@/src/shared/ui/brand-mark";
import { LoginForm } from "./login-form";
import { ServiceStatus } from "./service-status";
export function LoginRoute({ brandName }: { brandName?: string }) {
  return <main className="grid min-h-screen grid-rows-[auto_1fr_auto] bg-background px-5 py-6 text-foreground">
    <header className="mx-auto w-full max-w-6xl"><BrandMark name={brandName} /></header>
    <section className="grid place-items-center py-8"><div className="grid w-full max-w-[400px] gap-5"><LoginForm /><div className="flex justify-center"><ServiceStatus /></div></div></section>
    <footer className="text-center text-xs text-muted-foreground">Store Flow</footer>
  </main>;
}
