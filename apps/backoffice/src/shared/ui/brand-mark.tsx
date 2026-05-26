import { brandConfig } from "../config/brand";

type BrandMarkProps = {
  tone?: "light" | "dark";
};

export function BrandMark({ tone = "dark" }: BrandMarkProps) {
  const textColor = tone === "light" ? "text-white" : "text-foreground";
  const mutedColor = tone === "light" ? "text-white/70" : "text-muted-foreground";

  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center bg-primary text-primary-foreground shadow-[0_18px_45px_rgba(22,95,255,0.32)]">
        <span className="text-lg font-semibold tracking-normal">T</span>
      </div>
      <div className="grid gap-0.5">
        <p className={`text-base font-semibold leading-none ${textColor}`}>
          {brandConfig.name}
        </p>
        <p className={`text-xs leading-none ${mutedColor}`}>{brandConfig.context}</p>
      </div>
    </div>
  );
}
