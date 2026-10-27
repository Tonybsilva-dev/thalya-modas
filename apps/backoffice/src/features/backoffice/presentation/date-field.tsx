"use client";
import { useState } from "react";
import { CalendarBlank } from "@phosphor-icons/react";
import { Button, Calendar, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@store-flow/ui";

function dateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function DateField({ id, label, value, onValueChange, min, max }: {
  id: string; label: string; value: string; onValueChange: (value: string) => void; min?: string; max?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  const disabledDate = (date: Date) => Boolean((min && dateValue(date) < min) || (max && dateValue(date) > max));
  function select(next: string) { onValueChange(next); setOpen(false); }
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
      <Button id={id} type="button" variant="outline" className="min-h-11 w-full justify-between font-normal" aria-label={`${label}: ${selected ? selected.toLocaleDateString("pt-BR") : "selecionar data"}`}>
        <span>{selected ? selected.toLocaleDateString("pt-BR") : "dd/mm/aaaa"}</span><CalendarBlank size={18} aria-hidden="true" />
      </Button>
    </DialogTrigger>
    <DialogContent closeLabel="Fechar">
      <DialogHeader><DialogTitle>{label}: selecionar data</DialogTitle><DialogDescription>Escolha uma data no calendário.</DialogDescription></DialogHeader>
      <Calendar className="w-full border-0 p-0" selected={selected} onSelect={(date) => select(dateValue(date))} locale="pt-BR" previousMonthLabel="Mês anterior" nextMonthLabel="Próximo mês" subtitle="Selecione o dia" disabledDate={disabledDate} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => select("")}>Limpar data</Button>
        <Button type="button" disabled={disabledDate(new Date())} onClick={() => select(dateValue(new Date()))}>Hoje</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
