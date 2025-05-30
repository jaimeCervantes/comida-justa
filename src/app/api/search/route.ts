import { NextRequest } from "next/server";
import { collections } from "~/infrastructure/dataAccess/postUtils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const limit = parseInt(searchParams.get("limit") || "5", 10);
  const page = parseInt(searchParams.get("page") || "1", 10);
  if (!q) return Response.json({ results: [], total: 0 });

  // Firestore does not support full text search natively, so this is a simple example.
  // For production, consider Algolia, Elastic, or Firestore's new text search features.
  const snapshot = await collections.posts().get();
  const filtered = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(post => {
      const title = (typeof post === 'object' && post && 'title' in post && typeof post.title === 'string') ? post.title.toLowerCase() : "";
      const description = (typeof post === 'object' && post && 'content' in post && typeof post.content === 'string') ? post.content.toLowerCase() : "";
      return title.includes(q) || description.includes(q);
    });
  const total = filtered.length;
  const results = filtered
    .slice((page - 1) * limit, page * limit)

  return Response.json({ results, total });
} 