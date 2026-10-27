"use client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@store-flow/ui";
import { useState } from "react";
import { MutationError } from "./shared";
export function ActionDialog({
  title,
  description,
  open,
  onClose,
  onConfirm,
  pending,
  error,
  requireReason = true,
}: {
  title: string;
  description: string;
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  pending: boolean;
  error: unknown;
  requireReason?: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !pending) {
          setReason("");
          onClose();
        }
      }}
    >
      <DialogContent closeLabel="Fechar">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm(reason);
          }}
          className="space-y-5"
        >
          {requireReason && (
            <div className="space-y-2">
              <Label htmlFor="action-reason">Motivo da alteração</Label>
              <Input
                id="action-reason"
                minLength={5}
                maxLength={500}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Descreva o motivo para o histórico"
              />
            </div>
          )}
          <MutationError error={error} />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                setReason("");
                onClose();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Aplicando…" : "Confirmar alteração"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
