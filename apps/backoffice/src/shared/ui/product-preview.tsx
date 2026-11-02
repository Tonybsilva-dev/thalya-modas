"use client";
import { Image } from "@store-flow/ui/trinket";
import { Package } from "@phosphor-icons/react";
import { cn } from "@store-flow/ui";

export function ProductPreview({ src, name, className }: { src?: string; name: string; className?: string }) {
  if (!src) return <div className={cn("flex aspect-square items-center justify-center rounded-2xl bg-muted text-muted-foreground", className)} aria-label={`Sem imagem: ${name}`}><Package aria-hidden="true" className="size-8" /></div>;
  return <Image src={src} alt={name} objectFit="contain" aspectRatio="square" radius={16} className={cn("w-full bg-muted p-2", className)} fallback={<Package aria-label={`Imagem indisponível: ${name}`} className="size-8" />} />;
}
