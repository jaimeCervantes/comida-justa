import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.development") });

async function seedPosts() {
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is missing.");
    process.exit(1);
  }

  console.log("Connecting to PostgreSQL...");
  const { db } = await import("~/infra/dataAccess/db/connection");
  const { posts, postTranslations, postMedia } = await import(
    "~/infra/dataAccess/db/schema/posts"
  );

  console.log("Initializing Firebase...");
  const { collections } = await import("~/infra/dataAccess/postUtils");

  console.log("Fetching posts from Firestore...");
  const snap = await collections.posts().get();

  console.log(`Found ${snap.size} posts.`);

  let insertedPosts = 0;
  let insertedTranslations = 0;
  let insertedMedia = 0;

  for (const doc of snap.docs) {
    const data = doc.data();

    const postId = doc.id;
    const user = data.user ?? {};
    const translations = data.translations ?? {};
    const media = data.media ?? [];
    const contactInfo = data.contactInfo ?? {};

    const createdAt = data.createdAt?.toDate?.() ?? new Date();

    await db
      .insert(posts)
      .values({
        id: postId,
        userId: user.id ?? "",
        price: data.price ?? null,
        contactPhone: contactInfo.phone ?? null,
        contactEmail: contactInfo.email ?? null,
        contactWhatsapp: contactInfo.whatsapp ?? null,
        createdAt,
      })
      .onConflictDoUpdate({
        target: posts.id,
        set: {
          userId: user.id ?? "",
          price: data.price ?? null,
          contactPhone: contactInfo.phone ?? null,
          contactEmail: contactInfo.email ?? null,
          contactWhatsapp: contactInfo.whatsapp ?? null,
        },
      });

    insertedPosts++;

    for (const [locale, trans] of Object.entries(translations) as [
      string,
      { title?: string; slug?: string; content?: string },
    ][]) {
      await db
        .insert(postTranslations)
        .values({
          postId,
          locale,
          title: trans.title ?? "",
          slug: trans.slug ?? "",
          content: trans.content ?? "",
        })
        .onConflictDoNothing();
      insertedTranslations++;
    }

    for (const [index, mediaItem] of (Array.isArray(media)
      ? media
      : [media]
    ).entries()) {
      if (mediaItem?.url) {
        await db
          .insert(postMedia)
          .values({
            postId,
            url: mediaItem.url,
            type: mediaItem.type ?? "image",
            alt: mediaItem.alt ?? null,
            sortOrder: index,
          })
          .onConflictDoNothing();
        insertedMedia++;
      }
    }
  }

  console.log(`Seed complete:`);
  console.log(`  Posts: ${insertedPosts}`);
  console.log(`  Translations: ${insertedTranslations}`);
  console.log(`  Media: ${insertedMedia}`);
}

seedPosts()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
