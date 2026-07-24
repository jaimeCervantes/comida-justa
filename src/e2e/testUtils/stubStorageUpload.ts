import type { Page } from "@playwright/test";

const UPLOAD_URL = "https://storage.googleapis.com/mock-bucket/upload";

/**
 * Must be a host allowed by `next.config` `images.remotePatterns`, otherwise
 * `next/image` throws "hostname not configured" and the post detail fails to render.
 */
export const STUBBED_MEDIA_URL =
  "https://firebasestorage.googleapis.com/mock-bucket/posts/image/jpeg/post.jpg";

/**
 * Intercepts the three storage calls (signed URL → PUT to GCS → read URL) so publishing
 * never touches Google Cloud Storage. The real upload is a slow, non-deterministic external
 * dependency that stalls at 0% when the route is hit cold; no publishing scenario is about
 * GCS itself, so the calls are fulfilled deterministically here.
 *
 * Register it before the upload starts (i.e. before the file input is filled).
 */
export async function stubStorageUpload(page: Page): Promise<void> {
  await page.route("**/api/storage/signed-url", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        uploadUrl: UPLOAD_URL,
        filePath: "posts/image/jpeg/post.jpg",
        expiresAt: Date.now() + 15 * 60 * 1000,
      }),
    }),
  );

  await page.route(UPLOAD_URL, (route) => route.fulfill({ status: 200 }));

  await page.route("**/api/storage/read-url", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ publicUrl: STUBBED_MEDIA_URL }),
    }),
  );
}
