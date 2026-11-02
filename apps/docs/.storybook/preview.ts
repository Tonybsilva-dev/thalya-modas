import type { Preview } from "@storybook/react-vite";
import { createElement, useEffect, type ReactNode } from "react";

import "../src/styles.css";

function BrandTheme({ theme, children }: { theme: string; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    return () => document.documentElement.classList.remove("dark");
  }, [theme]);
  return createElement("div", { style: { color: "var(--foreground)", background: "var(--background)", minHeight: "100%" } }, children);
}

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Tema Store Flow, incluindo menus e diálogos em portal",
      toolbar: { icon: "circlehollow", items: [{ value: "light", title: "Claro" }, { value: "dark", title: "Escuro" }], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: "light" },
  decorators: [(Story, context) => createElement(BrandTheme, { theme: String(context.globals.theme ?? "light"), children: createElement(Story) })],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },
    options: {
      storySort: {
        order: [
          "Store Flow",
          "Nitro UI",
          "Components",
          [
            "Actions",
            "Forms",
            "Feedback",
            "Navigation",
            "Data Display",
            "Overlays",
            "Layout",
            "Motion",
          ],
        ],
      },
    },
  },
};

export default preview;
