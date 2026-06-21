import { config } from "dotenv";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.development");
console.log(`Loading env from: ${envPath}`);
const dotenvResult = config({ path: envPath, override: true });

if (dotenvResult.error) {
  console.error("Failed to load .env.development:", dotenvResult.error);
  process.exit(1);
}

async function seedComments() {
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is missing.");
    process.exit(1);
  }

  console.log("Connecting to PostgreSQL...");
  const { db } = await import("~/infra/dataAccess/db/connection");
  const { comments } = await import(
    "~/infra/dataAccess/db/schema/comments"
  );

  console.log("Connecting to Firestore...");
  const { db: firestore } = await import("~/infra/dataAccess/init");

  console.log("Fetching all posts from Firestore...");
  const postsSnap = await firestore.collection("posts").get();

  let inserted = 0;
  let skipped = 0;

  for (const postDoc of postsSnap.docs) {
    const commentsSnap = await postDoc.ref.collection("comments").get();

    if (commentsSnap.empty) continue;

    for (const commentDoc of commentsSnap.docs) {
      const data = commentDoc.data();

      if (!data.content) {
        skipped++;
        continue;
      }

      let createdAt: Date;
      if (data.createdAt?.toDate) {
        createdAt = data.createdAt.toDate();
      } else if (data.createdAt?._seconds) {
        createdAt = new Date(data.createdAt._seconds * 1000);
      } else if (data.createdAt instanceof Date) {
        createdAt = data.createdAt;
      } else {
        createdAt = new Date();
      }

      const user = data.user ?? {};

      try {
        await db
          .insert(comments)
          .values({
            id: commentDoc.id,
            postId: postDoc.id,
            userId: user.id ?? "",
            content: data.content,
            createdAt,
          })
          .onConflictDoNothing({ target: comments.id });

        inserted++;
      } catch (err: any) {
        console.error(
          `  Error inserting comment ${commentDoc.id}: ${err.message}`
        );
        skipped++;
      }
    }
  }

  console.log("\nSeed complete!");
  console.log(`  Comments inserted: ${inserted}`);
  console.log(`  Comments skipped: ${skipped}`);
}

seedComments()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
