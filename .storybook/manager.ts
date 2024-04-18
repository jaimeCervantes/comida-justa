import { addons } from "@storybook/manager-api";
import { create } from "@storybook/theming";

addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: "ComidaJusta",
    brandUrl: "https://comidajusta.site",
    brandImage:
      "https://comidajusta.site/wp-content/uploads/2024/02/android-chrome-512x512-1.png",
    colorSecondary: "#71ac43",
    barHoverColor: "#71ac43"
  }),
});
