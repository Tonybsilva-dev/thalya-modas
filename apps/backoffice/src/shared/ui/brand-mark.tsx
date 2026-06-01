import { brandConfig } from "../config/brand";

type BrandMarkProps = {
  context?: string;
  name?: string;
  tone?: "light" | "dark";
};

export function BrandMark({
  context = brandConfig.context,
  name = brandConfig.name,
  tone = "dark",
}: BrandMarkProps) {
  const textColor = tone === "light" ? "text-white" : "text-foreground";
  const mutedColor = tone === "light" ? "text-white/70" : "text-muted-foreground";
  const initial = name.trim().charAt(0).toUpperCase() || "S";

  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center bg-primary text-primary-foreground shadow-[0_18px_45px_rgba(22,95,255,0.32)]">
        <span className="text-lg font-semibold tracking-normal">{initial}</span>
      </div>
      <div className="grid gap-0.5">
        <p className={`text-base font-semibold leading-none ${textColor}`}>
          {name}
        </p>
        <p className={`text-xs leading-none ${mutedColor}`}>{context}</p>
      </div>
    </div>
  );
}
