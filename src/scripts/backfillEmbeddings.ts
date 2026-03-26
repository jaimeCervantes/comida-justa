import { config } from "dotenv";
import { resolve } from "path";
import { FieldValue } from "firebase-admin/firestore";

// 1. Load Environment Variables BEFORE importing anything that uses them
console.log("Loading environment variables...");
config({ path: resolve(process.cwd(), ".env.production") });

async function backfillEmbeddings() {
  // 2. Validate Env
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("ERROR: FIREBASE_SERVICE_ACCOUNT is missing.");
    console.error(
      "Make sure .env.production exists and contains the service account JSON.",
    );
    process.exit(1);
  }

  // 3. Dynamic Import (Ensures init.ts runs AFTER config())
  console.log("Initializing Firebase...");
  const { db } = await import("~/infra/dataAccess/init");
  const { default: VertexEmbeddingService } =
    await import("~/infra/services/VertexEmbeddingService");

  console.log("Starting backfill of embeddings...");

  const postsRef = db.collection("posts");
  const embeddingService = new VertexEmbeddingService();

  const snapshot = await postsRef.get();

  if (snapshot.empty) {
    console.log("No posts found.");
    return;
  }

  console.log(`Found ${snapshot.size} posts. Processing...`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const translations = data.translations || {};
    const updates: any = {};
    let needsUpdate = false;

    console.log(`Processing post: ${doc.id}`);

    // Loop through each language (e.g., 'es', 'en')
    for (const [lang, content] of Object.entries(translations)) {
      const postContent = content as any;

      // Skip if embedding already exists
      if (postContent.embedding) {
        // console.log(`  - Language '${lang}': Embedding already exists.`);
        continue;
      }

      if (!postContent.title && !postContent.content) {
        console.warn(
          `  - Language '${lang}': SKIPPING - Missing title/content.`,
        );
        continue;
      }

      console.log(`  - Language '${lang}': Generating embedding...`);

      try {
        const textToEmbed = `${postContent.title || ""}\n${
          postContent.content || ""
        }`.trim();

        if (!textToEmbed) continue;

        const vector = await embeddingService.generateEmbedding(textToEmbed);

        // Prepare update path: "translations.es.embedding"
        updates[`translations.${lang}.embedding`] = FieldValue.vector(vector);
        needsUpdate = true;

        // Small delay to avoid hitting rate limits effectively
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `  - Language '${lang}': FAILED to generate embedding.`,
          error,
        );
        errorCount++;
      }
    }

    if (needsUpdate) {
      try {
        await doc.ref.update(updates);
        console.log(`  -> Updated post ${doc.id}`);
        updatedCount++;
      } catch (error) {
        console.error(`  -> Failed to update post ${doc.id}`, error);
        errorCount++;
      }
    } else {
      skippedCount++;
    }
  }

  console.log("------------------------------------------------");
  console.log("Backfill Complete.");
  console.log(`Total Posts: ${snapshot.size}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped (Already had embeddings): ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
}

backfillEmbeddings().catch(console.error);
