'use client';

import { useEffect, useState, useRef } from 'react';
import Card from '~/components/ui/Card';
import CurrencyAmount from '~/components/ui/CurrencyAmount';
import Link from 'next/link';
import { getPosts } from '~/firebase/models/posts';
import { mapPostsToCards } from '~/mappers/posts/mapPostsToCards';
import { Post } from '~/types/Posts';

type CardPost = Post & {
  createdAtLocale: string;
  to: string;
};

export default function FoodListClient() {
  const [foods, setFoods] = useState<CardPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastPost, setLastPost] = useState<any>(null); 
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const result = await getPosts({ limit: 6, startAfter: lastPost });
    const newFoods = mapPostsToCards(result.posts);

    setFoods(prev => [...prev, ...newFoods]);
    setLastPost(result.lastItem); 
    setHasMore(result.posts.length > 0); 
    setLoading(false);
  };

  useEffect(() => {
    loadMore(); // carga inicial
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        rootMargin: '100px',
      }
    );

    const current = observerRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [observerRef.current, loading, hasMore]);

  return (
    <section className="grid grid-flow-dense gap-4 pt-6 sm:grid-cols-[repeat(auto-fill,_minmax(300px,_1fr))]">
      {foods.length === 0 && !loading ? (
        <p>No hay comidas publicadas aún.</p>
      ) : (
        foods.map(
          ({
            id,
            title,
            image,
            createdAt,
            createdAtLocale,
            price,
            user,
            to,
          }) => (
            <Card
              key={id}
              title={title}
              image={image}
              createdAt={createdAt}
              createdAtLocale={createdAtLocale}
              user={user}
              className="flex flex-col justify-between bg-white dark:bg-pw-gray rounded-3xl overflow-hidden hover:border-b-pw-lightgreen dark:border-t-0 dark:border-r-0 dark:border-l-0 border-b-8 border-b-transparent"
              AnchorElement={Link}
              anchorProps={{ href: to, title: title }}
            >
              <CurrencyAmount value={price} locale="es-MX" currency="MXN" />
            </Card>
          )
        )
      )}

      {/* Indicador para el scroll infinito ;) */}
      {hasMore && <div ref={observerRef} className="h-10" />}
      {loading && <p className="text-center col-span-full">Cargando más comidas...</p>}
    </section>
  );
}
