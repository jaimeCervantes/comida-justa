import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";
import { PUBLIC_BRAND_NAME } from "../src/infra/constants";

addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: PUBLIC_BRAND_NAME,
    brandUrl: "https://hazlosano.com",
    brandImage:
      "https://comidajusta.site/wp-content/uploads/2024/02/android-chrome-512x512-1.png",
    colorSecondary: "#71ac43",
    barHoverColor: "#71ac43",
  }),
});
