"use client";
import { Button } from "@store-flow/ui";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section role="alert" className="space-y-4 border bg-card p-8">
      <h2 className="font-semibold">Não foi possível abrir esta página.</h2>
      <Button variant="outline" onClick={reset}>
        Tentar novamente
      </Button>
    </section>
  );
}
