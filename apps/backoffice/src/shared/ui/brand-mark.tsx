import Image from "next/image";

import { brandConfig } from "../config/brand";

type BrandMarkProps = {
  context?: string;
  name?: string;
  showContext?: boolean;
  tone?: "light" | "dark";
};

export function BrandMark({
  context = brandConfig.context,
  name = brandConfig.name,
  showContext = true,
  tone = "dark",
}: BrandMarkProps) {
  const textColor = tone === "light" ? "text-white" : "text-foreground";
  const mutedColor = tone === "light" ? "text-white/70" : "text-muted-foreground";

  return (
    <div className="flex items-center gap-3">
      <div className="relative size-10 overflow-hidden shadow-[0_18px_45px_rgba(22,95,255,0.28)]">
        <Image
          alt={`${name} logo`}
          className="object-cover"
          fill
          priority
          sizes="40px"
          src="/logo-icon-square.png"
        />
      </div>
      <div className="grid gap-0.5">
        <p className={`text-base font-semibold leading-none ${textColor}`}>
          {name}
        </p>
        {showContext ? <p className={`text-xs leading-none ${mutedColor}`}>{context}</p> : null}
      </div>
    </div>
  );
}
