"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { getPosts } from "~/firebase/models/posts.client";
import type { Post } from "~/types/Posts";
import { QueryDocumentSnapshot } from "firebase/firestore";
import Card from "~/components/ui/Card"

export default function FoodListClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastItem, setLastItem] = useState<QueryDocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const { posts: newPosts, lastItem: newLastItem } = await getPosts({
      limit: 6,
      startAfter: lastItem,
    });

    if (newPosts.length === 0) {
      setHasMore(false);
    } else {
      setPosts((prev) => [...prev, ...newPosts]);
      setLastItem(newLastItem);
    }

    setLoading(false);
  }, [lastItem, hasMore, loading]);

  useEffect(() => {
    fetchPosts();
  }, []); // carga inicial

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchPosts();
        }
      },
      {
        rootMargin: "100px",
      }
    );

    const current = observerRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [fetchPosts, hasMore]);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post) => (
          <Card 
            key={post.id}
            title={post.title}
            image={post.image}
            fileType={post.fileType}
            createdAt={post.createdAt} 
            createdAtLocale={post.createdAtLocale} 
            user={post.user}
            anchorProps={{
              href: `/posts/${post.slug}`,
              title: post.title,
            }} 
            children={undefined} 
            />
        ))}
      </div>

      <div ref={observerRef} className="h-10 flex justify-center items-center">
        {loading && <span className="text-gray-500">Cargando más...</span>}
        {!hasMore && <span className="text-gray-400">No hay más posts</span>}
      </div>
    </div>
  );
}
