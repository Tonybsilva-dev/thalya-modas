"use client";
import type { FeatureModule, Flags } from "../application/plans-api";
import { Button, Checkbox } from "@store-flow/ui";
export function FeatureMatrix({
  catalog,
  flags,
  onChange,
}: {
  catalog: FeatureModule[];
  flags: Flags;
  onChange: (flags: Flags) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {catalog.map((module) => (
        <fieldset key={module.key} className="rounded-none border p-4">
          <legend className="px-2 text-sm font-semibold">{module.label}</legend>
          <Button type="button" variant="outline" size="sm" className="mb-2 w-full" onClick={() => onChange({ ...flags, [module.key]: true, ...Object.fromEntries(module.features.filter((feature) => feature.available).map((feature) => [feature.key, true])) })}>Incluir módulo completo</Button>
          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 text-sm">
            <span>Habilitar módulo</span>
            <Checkbox
              checked={flags[module.key] ?? false}
              onCheckedChange={(checked) =>
                onChange({ ...flags, [module.key]: checked === true })
              }
            />
          </label>
          <p className="mb-3 text-xs text-muted-foreground">
            {module.description}
          </p>
          <div className="border-t pt-2">
            {module.features.map((feature) => (
              <label
                key={feature.key}
                className="flex min-h-11 cursor-pointer items-center justify-between gap-4 text-sm"
              >
                <span>
                  {feature.label}
                  {!feature.available && " · Em desenvolvimento"}
                </span>
                <Checkbox
                  disabled={!feature.available}
                  checked={flags[feature.key] ?? false}
                  onCheckedChange={(checked) =>
                    onChange({ ...flags, [feature.key]: checked === true })
                  }
                />
              </label>
            ))}
          </div>
          {!flags[module.key] && (
            <p className="mt-2 text-xs text-muted-foreground">
              As funcionalidades selecionadas só terão efeito com o módulo
              habilitado.
            </p>
          )}
        </fieldset>
      ))}
    </div>
  );
}
