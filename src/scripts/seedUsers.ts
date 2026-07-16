import { config } from "dotenv";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.development");
console.log(`Loading env from: ${envPath}`);
const dotenvResult = config({ path: envPath, override: true });

if (dotenvResult.error) {
  console.error("Failed to load .env.development:", dotenvResult.error);
  process.exit(1);
}
console.log("Environment loaded. Checking key vars...");
console.log(
  "  DATABASE_URL:",
  process.env.DATABASE_URL ? "set" : "MISSING"
);
console.log(
  "  FIREBASE_SERVICE_ACCOUNT:",
  process.env.FIREBASE_SERVICE_ACCOUNT ? "set" : "MISSING"
);

/** Parse a value that could be a Firestore Timestamp, a Unix epoch (seconds), or a Date */
function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value * 1000);
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  // Firestore Timestamp object: { _seconds: number, _nanoseconds: number }
  if (typeof value === "object" && "_seconds" in (value as Record<string, unknown>)) {
    return new Date((value as { _seconds: number })._seconds * 1000);
  }
  return null;
}

async function seedUsers() {
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is missing.");
    process.exit(1);
  }

  console.log("Connecting to PostgreSQL...");
  const { db } = await import("~/infra/dataAccess/db/connection");
  const {
    users,
    accounts,
    sessions,
  } = await import("~/infra/dataAccess/db/schema/auth");

  console.log("Initializing Firestore...");
  const { db: firestore } = await import("~/infra/dataAccess/init");

  // ── USERS ──────────────────────────────────────────────────────────
  console.log("\n── Users collection ──");
  const usersSnap = await firestore.collection("users").get();
  console.log(`  Fetched ${usersSnap.size} user documents`);

  let insertedUsers = 0;
  let skippedUsers = 0;

  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const docId = doc.id;

    // Print first doc shape for debugging
    if (insertedUsers === 0 && skippedUsers === 0) {
      console.log("  First user doc keys:", Object.keys(data));
      console.log("  First user doc sample:", JSON.stringify(data, null, 2).slice(0, 400));
    }

    if (!data.email) {
      skippedUsers++;
      console.log(`  Skipping user ${docId}: no email address`);
      continue;
    }

    try {
      await db
        .insert(users)
        .values({
          id: data.id ?? docId,
          name: data.name ?? data.displayName ?? null,
          email: data.email,
          emailVerified: toDate(data.emailVerified ?? data.email_verified),
          image: data.image ?? data.photoURL ?? data.picture ?? null,
          externalId: data.id ?? docId,
        })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            name: data.name ?? data.displayName ?? null,
            image: data.image ?? data.photoURL ?? data.picture ?? null,
          },
        });

      insertedUsers++;
    } catch (err: any) {
      console.error(`  Error inserting user ${docId}: ${err.message}`);
      skippedUsers++;
    }
  }

  console.log(`  Users inserted: ${insertedUsers}, skipped: ${skippedUsers}`);

  // ── ACCOUNTS ───────────────────────────────────────────────────────
  console.log("\n── Accounts collection ──");
  const accountsSnap = await firestore.collection("accounts").get();
  console.log(`  Fetched ${accountsSnap.size} account documents`);

  let insertedAccounts = 0;
  let skippedAccounts = 0;

  for (const doc of accountsSnap.docs) {
    const data = doc.data();

    // Print first doc shape for debugging
    if (insertedAccounts === 0 && skippedAccounts === 0) {
      console.log("  First account doc keys:", Object.keys(data));
      console.log("  First account doc sample:", JSON.stringify(data, null, 2).slice(0, 400));
    }

    if (!data.userId && !data.user_id) {
      skippedAccounts++;
      console.log(`  Skipping account ${doc.id}: missing userId`);
      continue;
    }

    try {
      await db
        .insert(accounts)
        .values({
          userId: data.userId ?? data.user_id,
          type: data.type ?? "oauth",
          provider: data.provider ?? data.providerId ?? "",
          providerAccountId:
            data.providerAccountId ?? data.provider_account_id ?? "",
          refresh_token: data.refresh_token ?? data.refreshToken ?? null,
          access_token: data.access_token ?? data.accessToken ?? null,
          // expires_at is integer (epoch seconds) per NextAuth adapter spec
          expires_at: (data.expires_at ?? data.expiresAt ?? null) as number | null,
          token_type: data.token_type ?? data.tokenType ?? null,
          scope: data.scope ?? null,
          id_token: data.id_token ?? data.idToken ?? null,
          session_state: data.session_state ?? data.sessionState ?? null,
        })
        .onConflictDoNothing({
          target: [accounts.provider, accounts.providerAccountId],
        });

      insertedAccounts++;
    } catch (err: any) {
      console.error(`  Error inserting account ${doc.id}: ${err.message}`);
      skippedAccounts++;
    }
  }

  console.log(
    `  Accounts inserted: ${insertedAccounts}, skipped: ${skippedAccounts}`
  );

  // ── SESSIONS ───────────────────────────────────────────────────────
  console.log("\n── Sessions collection ──");
  const sessionsSnap = await firestore.collection("sessions").get();
  console.log(`  Fetched ${sessionsSnap.size} session documents`);

  let insertedSessions = 0;
  let skippedSessions = 0;

  for (const doc of sessionsSnap.docs) {
    const data = doc.data();

    // Print first doc shape for debugging
    if (insertedSessions === 0 && skippedSessions === 0) {
      console.log("  First session doc keys:", Object.keys(data));
      console.log("  First session doc sample:", JSON.stringify(data, null, 2).slice(0, 400));
    }

    const sessionToken = data.sessionToken ?? data.session_token;
    if (!sessionToken) {
      skippedSessions++;
      console.log(`  Skipping session ${doc.id}: missing sessionToken`);
      continue;
    }

    const expires = toDate(data.expires);
    if (!expires) {
      skippedSessions++;
      console.log(`  Skipping session ${doc.id}: unparseable expires field`);
      continue;
    }

    try {
      await db
        .insert(sessions)
        .values({
          sessionToken,
          userId: data.userId ?? data.user_id ?? "",
          expires,
        })
        .onConflictDoUpdate({
          target: sessions.sessionToken,
          set: {
            expires,
          },
        });

      insertedSessions++;
    } catch (err: any) {
      console.error(`  Error inserting session ${doc.id}: ${err.message}`);
      skippedSessions++;
    }
  }

  console.log(
    `  Sessions inserted: ${insertedSessions}, skipped: ${skippedSessions}`
  );

  // ── SUMMARY ────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════");
  console.log("Seed complete!");
  console.log(`  Users:    ${insertedUsers} inserted, ${skippedUsers} skipped`);
  console.log(`  Accounts: ${insertedAccounts} inserted, ${skippedAccounts} skipped`);
  console.log(`  Sessions: ${insertedSessions} inserted, ${skippedSessions} skipped`);
  console.log("═══════════════════════════════════════");
}

seedUsers()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
