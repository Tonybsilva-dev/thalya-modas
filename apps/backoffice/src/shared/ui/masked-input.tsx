"use client";
import { useMemo } from "react";
import { MaskedInput as PublishedMaskedInput, cn } from "@store-flow/ui";
import type { MaskedInputProps as PublishedMaskedInputProps } from "@store-flow/ui";

type MaskedInputMask = string | { mask: string }[];
type MaskedInputProps = Omit<PublishedMaskedInputProps, "mask" | "onAccept" | "unmask"> & {
  mask: MaskedInputMask;
  onValueChange?: (value: string) => void;
};
export function MaskedInput({ className, classNames, mask, onValueChange, ...props }: MaskedInputProps) {
  // Callers often pass array literals. Keep IMask options stable across value updates.
  const maskKey = JSON.stringify(mask);
  const options = useMemo(() => ({ mask: JSON.parse(maskKey) as MaskedInputMask }), [maskKey]);
  return <PublishedMaskedInput {...props} mask={options} unmask={false}
    onAccept={(_, formatted) => onValueChange?.(formatted)}
    className={cn("h-[var(--sf-control-height)] text-sm pointer-coarse:min-h-11", className)}
    classNames={{ ...classNames, root: cn("h-[var(--sf-control-height)] pointer-coarse:min-h-11", classNames?.root), input: cn("text-sm", classNames?.input) }} />;
}
