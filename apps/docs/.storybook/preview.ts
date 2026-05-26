import type { Preview } from "@storybook/react-vite";

import "../src/styles.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#171717" },
      ],
    },
    options: {
      storySort: {
        order: [
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
