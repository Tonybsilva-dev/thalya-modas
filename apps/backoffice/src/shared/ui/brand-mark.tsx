import Image from "next/image";

import { brandConfig } from "../config/brand";

type BrandMarkProps = {
  context?: string;
  name?: string;
  showContext?: boolean;
  tone?: "light" | "dark";
  compact?: boolean;
};

export function BrandMark({
  context = brandConfig.context,
  name = brandConfig.name,
  showContext = true,
  tone = "dark",
  compact = false,
}: BrandMarkProps) {
  const textColor = tone === "light" ? "text-white" : "text-foreground";
  const mutedColor = tone === "light" ? "text-white/70" : "text-muted-foreground";

  return (
    <div className={`flex items-center gap-3 ${compact ? "justify-center" : ""}`}>
      <div className="relative size-8 overflow-hidden">
        <Image
          alt={`${name} logo`}
          className="object-cover"
          fill
          priority
          sizes="40px"
          src="/logo-icon-square.png"
        />
      </div>
      <div className={compact ? "sr-only" : "grid gap-0.5"}>
        <p className={`text-base font-semibold leading-none ${textColor}`}>
          {name}
        </p>
        {showContext ? <p className={`text-xs leading-none ${mutedColor}`}>{context}</p> : null}
      </div>
    </div>
  );
}
