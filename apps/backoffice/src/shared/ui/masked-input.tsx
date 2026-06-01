"use client";

import type { ComponentType, InputHTMLAttributes } from "react";
import { IMaskInput } from "react-imask";
import { cn } from "@thalya-modas/ui";

type MaskedInputMask = string | { mask: string }[];

type MaskedInputInternalProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "mask" | "onAccept"
> & {
  mask: MaskedInputMask;
  onAccept?: (value: unknown) => void;
  unmask?: boolean;
};

type MaskedInputProps = Omit<MaskedInputInternalProps, "onAccept" | "unmask"> & {
  onValueChange?: (value: string) => void;
};

const TypedIMaskInput = IMaskInput as unknown as ComponentType<MaskedInputInternalProps>;

export function MaskedInput({
  className,
  onValueChange,
  ...props
}: MaskedInputProps) {
  return (
    <TypedIMaskInput
      className={cn(
        "flex h-10 w-full rounded-none border border-input bg-card px-3 py-2 text-sm text-foreground shadow-none outline-none transition-[border-color,box-shadow] duration-base ease-nitro file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      onAccept={(value) => onValueChange?.(String(value))}
      unmask={false}
      {...props}
    />
  );
}
