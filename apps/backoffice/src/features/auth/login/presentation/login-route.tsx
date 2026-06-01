import { BrandMark } from "@/src/shared/ui/brand-mark";

import { loginRouteContent } from "../domain/login-route-content";
import { LoginForm } from "./login-form";

type LoginRouteProps = {
  brandName?: string;
};

const backgroundImage =
  "https://images.unsplash.com/photo-1567966374914-fcf38ba2bd8d?auto=format&fit=crop&q=80&w=1800";

export function LoginRoute({ brandName }: LoginRouteProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(17,17,17,0.90)_0%,rgba(51,51,51,0.40)_48%,rgba(255,255,255,0.14)_100%)]" />

      <section className="relative z-10 grid min-h-screen grid-cols-1 gap-10 px-6 py-8 md:px-12 lg:grid-cols-[minmax(0,1fr)_440px] lg:px-16 lg:py-14">
        <div className="flex min-h-[44rem] flex-col justify-between">
          <BrandMark name={brandName} tone="light" />

          <div className="max-w-[520px] animate-nitro-slide-up text-white">
            <h2 className="text-4xl font-semibold leading-[1.08] tracking-normal md:text-[44px]">
              {loginRouteContent.hero.title}
            </h2>
            <p className="mt-4 max-w-[500px] text-base leading-7 text-white/80">
              {loginRouteContent.hero.description}
            </p>
          </div>

          <div className="flex w-fit items-center gap-2.5 bg-white/10 px-3 py-2 text-sm font-medium text-white shadow-[0_18px_55px_rgba(0,0,0,0.22)] backdrop-blur-sm">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping bg-[#ddf0c9]/40" />
              <span className="relative inline-flex size-2.5 bg-[#ddf0c9]" />
            </span>
            {loginRouteContent.status}
          </div>
        </div>

        <div className="flex items-center justify-center lg:justify-end">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
