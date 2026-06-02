"use client";

import { Desktop, Moon, Sun } from "@phosphor-icons/react";
import { ToggleButton, ToggleButtonGroup } from "@thalya-modas/ui";
import { useTranslations } from "next-intl";

import { useAppUiStore } from "../state/app-ui-store";
import type { ThemeMode } from "../theme/theme-cookie";

const themeOptions: Array<{
  icon: typeof Sun;
  labelKey: "dark" | "light" | "system";
  value: ThemeMode;
}> = [
  { icon: Sun, labelKey: "light", value: "light" },
  { icon: Moon, labelKey: "dark", value: "dark" },
  { icon: Desktop, labelKey: "system", value: "system" },
];

export function ThemeSwitcher() {
  const t = useTranslations("common.theme");
  const themeMode = useAppUiStore((state) => state.themeMode);
  const setThemeMode = useAppUiStore((state) => state.setThemeMode);

  return (
    <div className="flex flex-col gap-3 border-b border-border py-3.5 md:flex-row md:items-center">
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium text-foreground">{t("title")}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <ToggleButtonGroup aria-label={t("ariaLabel")} className="w-full md:w-auto">
        {themeOptions.map(({ icon: Icon, labelKey, value }) => (
          <ToggleButton
            key={value}
            className="flex-1 md:flex-none"
            pressed={themeMode === value}
            size="sm"
            onClick={() => setThemeMode(value)}
          >
            <Icon className="size-[15px]" />
            {t(labelKey)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}
