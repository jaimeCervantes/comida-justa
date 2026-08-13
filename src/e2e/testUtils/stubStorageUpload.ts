import type { Page } from "@playwright/test";

const UPLOAD_URL = "https://storage.googleapis.com/mock-bucket/upload";

/**
 * Must be a host allowed by `next.config` `images.remotePatterns`, otherwise
 * `next/image` throws "hostname not configured" and the post detail fails to render.
 *
 * There is one per file a scenario may upload, because a publication now carries several. Serving
 * the same URL twice would look like a success and store a duplicate: the publish form de-duplicates
 * by storage path, so two files answered with one path collapse into a single tray entry and the
 * scenario would assert "2 files" against a page showing one.
 */
export const STUBBED_MEDIA_URLS = [
  "https://firebasestorage.googleapis.com/mock-bucket/posts/image/jpeg/post.jpg",
  "https://firebasestorage.googleapis.com/mock-bucket/posts/image/jpeg/post-2.jpg",
  "https://firebasestorage.googleapis.com/mock-bucket/posts/image/jpeg/post-3.jpg",
  "https://firebasestorage.googleapis.com/mock-bucket/posts/video/mp4/post.mp4",
] as const;

/** The first one, for the scenarios that only ever upload a single file. */
export const STUBBED_MEDIA_URL = STUBBED_MEDIA_URLS[0];

/**
 * Intercepts the three storage calls (signed URL → PUT to GCS → read URL) so publishing
 * never touches Google Cloud Storage. The real upload is a slow, non-deterministic external
 * dependency that stalls at 0% when the route is hit cold; no publishing scenario is about
 * GCS itself, so the calls are fulfilled deterministically here.
 *
 * Register it before the upload starts (i.e. before the file input is filled).
 */
export async function stubStorageUpload(page: Page): Promise<void> {
  /* One counter per registration, so each `page` starts at the first URL and a scenario that
     uploads three files gets three different ones, in order. Uploads run one after another
     (`useStorageUpload.uploadFiles` is sequential), so the pairing is deterministic. */
  let served = 0;

  await page.route("**/api/storage/signed-url", (route) => {
    const index = served % STUBBED_MEDIA_URLS.length;
    served += 1;

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        uploadUrl: UPLOAD_URL,
        /* The path is what the form de-duplicates by, so it has to differ per file for the same
           reason the public URL does. */
        filePath: `posts/upload-${index}`,
        expiresAt: Date.now() + 15 * 60 * 1000,
      }),
    });
  });

  await page.route(UPLOAD_URL, (route) => route.fulfill({ status: 200 }));

  await page.route("**/api/storage/read-url", (route) => {
    const path = (route.request().postDataJSON()?.path ?? "") as string;
    const index = Number(path.replace("posts/upload-", ""));

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        /* Answered from the path the client sends back, not from a second counter: the two routes
           would drift apart the moment a retry hit only one of them. */
        publicUrl:
          STUBBED_MEDIA_URLS[
            Number.isNaN(index) ? 0 : index % STUBBED_MEDIA_URLS.length
          ],
      }),
    });
  });
}
