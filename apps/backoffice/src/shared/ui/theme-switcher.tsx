"use client";

import { Desktop, Moon, Sun } from "@phosphor-icons/react";
import { ToggleButton, ToggleButtonGroup } from "@thalya-modas/ui";

import { useAppUiStore } from "../state/app-ui-store";
import type { ThemeMode } from "../theme/theme-cookie";

const themeOptions: Array<{
  icon: typeof Sun;
  label: string;
  value: ThemeMode;
}> = [
  { icon: Sun, label: "Light", value: "light" },
  { icon: Moon, label: "Dark", value: "dark" },
  { icon: Desktop, label: "System", value: "system" },
];

export function ThemeSwitcher() {
  const themeMode = useAppUiStore((state) => state.themeMode);
  const setThemeMode = useAppUiStore((state) => state.setThemeMode);

  return (
    <div className="flex flex-col gap-3 border-b border-border py-3.5 md:flex-row md:items-center">
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium text-foreground">Theme</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Choose light, dark or system appearance for the backoffice.
        </p>
      </div>

      <ToggleButtonGroup aria-label="Theme mode" className="w-full md:w-auto">
        {themeOptions.map(({ icon: Icon, label, value }) => (
          <ToggleButton
            key={value}
            className="flex-1 md:flex-none"
            pressed={themeMode === value}
            size="sm"
            onClick={() => setThemeMode(value)}
          >
            <Icon className="size-[15px]" />
            {label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}
