import type { Preview } from "@storybook/nextjs";
import "../src/app/styles/globals.css";

/**
 * El selector de tema del catálogo.
 *
 * El sitio sigue la preferencia del sistema (`prefers-color-scheme`), que dentro de Storybook no se
 * puede cambiar sin tocar el navegador entero. Por eso `colors.css` acepta además un
 * `data-theme` explícito: aquí se escribe en `<html>` y el catálogo puede enseñar claro y oscuro
 * lado a lado sin salir de la página.
 */
const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Tema del design system",
      toolbar: {
        title: "Tema",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Claro", icon: "sun" },
          { value: "dark", title: "Oscuro", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === "dark" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.style.colorScheme = theme;
      return Story();
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
