"use client";

import { useEffect } from "react";

import { useAppUiStore } from "../state/app-ui-store";
import { serializeThemeModeCookie, type ThemeMode } from "./theme-cookie";

const darkSchemeQuery = "(prefers-color-scheme: dark)";

function resolveThemeMode(themeMode: ThemeMode, media: MediaQueryList) {
  if (themeMode === "system") {
    return media.matches ? "dark" : "light";
  }

  return themeMode;
}

function applyThemeMode(themeMode: ThemeMode) {
  const media = window.matchMedia(darkSchemeQuery);

  const updateTheme = () => {
    const resolvedTheme = resolveThemeMode(themeMode, media);

    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    document.documentElement.dataset.theme = themeMode;
  };

  updateTheme();

  if (themeMode !== "system") {
    return undefined;
  }

  media.addEventListener("change", updateTheme);

  return () => media.removeEventListener("change", updateTheme);
}

export function ThemeController() {
  const themeMode = useAppUiStore((state) => state.themeMode);

  useEffect(() => {
    document.cookie = serializeThemeModeCookie(themeMode);

    return applyThemeMode(themeMode);
  }, [themeMode]);

  return null;
}
