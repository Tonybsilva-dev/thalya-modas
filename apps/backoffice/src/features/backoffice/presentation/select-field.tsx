"use client";
import { Children, isValidElement, useEffect, useRef, useState, type ReactNode, type ReactElement } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@store-flow/ui";

type OptionProps = { value: string; disabled?: boolean; children: ReactNode };
const emptyValue = "__store_flow_empty__";
export function SelectFieldOption({ value, disabled, children }: OptionProps) {
  if (value === "" && disabled) return null;
  return <SelectItem value={value || emptyValue} disabled={disabled}>{children}</SelectItem>;
}
export function SelectField({ id, name, value, defaultValue, onValueChange, disabled, required, className, children, "aria-label": ariaLabel }: {
  id?: string; name?: string; value?: string; defaultValue?: string; onValueChange?: (value: string) => void;
  disabled?: boolean; required?: boolean; className?: string; children: ReactNode; "aria-label"?: string;
}) {
  const options = Children.toArray(children).filter((child): child is ReactElement<OptionProps> => isValidElement<OptionProps>(child));
  const placeholder = options.find((option) => option.props.value === "" && option.props.disabled)?.props.children;
  const [selection, setSelection] = useState(defaultValue ?? options[0]?.props.value ?? "");
  const trigger = useRef<HTMLButtonElement>(null);
  const initialValue = defaultValue ?? options[0]?.props.value ?? "";
  useEffect(() => {
    const form = trigger.current?.closest("form");
    const reset = () => { setSelection(initialValue); onValueChange?.(initialValue); };
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [initialValue, onValueChange]);
  const selected = value ?? selection;
  const internal = selected === "" && !placeholder ? emptyValue : selected;
  return <>
    <Select name={name} value={internal} disabled={disabled} required={required} onValueChange={(next) => {
      const result = next === emptyValue ? "" : next;
      setSelection(result); onValueChange?.(result);
    }}>
      <SelectTrigger ref={trigger} id={id} aria-label={ariaLabel} className={className}><SelectValue placeholder={placeholder ?? "Selecione"} /></SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  </>;
}
