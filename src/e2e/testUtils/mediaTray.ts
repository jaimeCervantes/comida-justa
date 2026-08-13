import type { Locator, Page } from "@playwright/test";

/**
 * The locators of `PostMediaTray`, in one place.
 *
 * The tray is a single component used by two screens — publishing and editing — so its
 * `data-testid`s and the accessible names of its buttons are read from here. Repeated inside each
 * page object, renaming one of them would leave the other screen broken with nothing to say so.
 *
 * Positions are **1-based**, the number the thumbnail shows, because that is what the scenarios say
 * ("quita el archivo de la posicion 2") and what the button announces to a screen reader.
 */
export class MediaTray {
  constructor(private readonly page: Page) {}

  items(): Locator {
    return this.page.getByTestId("post-media-tray-item");
  }

  counter(): Locator {
    return this.page.getByTestId("post-media-tray-counter");
  }

  remove(position: number): Locator {
    return this.page.getByRole("button", {
      name: new RegExp(`quitar el archivo ${position}`, "i"),
    });
  }

  /** Moves the file one place towards the cover. */
  moveEarlier(position: number): Locator {
    return this.page.getByRole("button", {
      name: new RegExp(`archivo ${position} antes`, "i"),
    });
  }

  /** Moves the file one place towards the end. */
  moveLater(position: number): Locator {
    return this.page.getByRole("button", {
      name: new RegExp(`archivo ${position} despu[eé]s`, "i"),
    });
  }

  /** The thumbnail itself, which opens the file at full size. */
  preview(position: number): Locator {
    return this.page.getByRole("button", {
      name: new RegExp(`ver el archivo ${position} en grande`, "i"),
    });
  }

  /** The full-size view, once open. */
  previewDialog(): Locator {
    return this.page.getByTestId("media-preview");
  }

  /** The file input of the picker that feeds the tray. */
  filePicker(): Locator {
    return this.page.locator('form input[type="file"]');
  }
}
