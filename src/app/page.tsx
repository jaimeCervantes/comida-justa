import { Metadata } from 'next';
import { getMultiplePosts } from "~/firebase/getMultiplePosts";
import { mapPostsToCards } from "~/mappers/posts/mapPostsToCards";
import PostsWithLoadMore from "./(home)/PostsWithLoadMore";
import { CANONICAL_URL } from '~/constants';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Comida Justa: Alimentos saludables para ti y tu comunidad',
    description: 'Descubre cómo evitar enfermedades, ahorrar tiempo y dinero, al mismo tiempo que apoyas al medio ambiente y a tu comunidad con alimentos saludables.',
    openGraph: {
      title: 'Comida Justa: Alimentos saludables para ti y tu comunidad',
      description: 'Descubre cómo evitar enfermedades, ahorrar tiempo y dinero, al mismo tiempo que apoyas al medio ambiente y a tu comunidad.',
      images: ['https://scontent.fjal3-1.fna.fbcdn.net/v/t39.30808-6/287090884_10160098077714269_9122885979944977964_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=2285d6&_nc_eui2=AeHkH00dzIfKSCs6ky0CFJbcQrVnEISsdaFCtWcQhKx1oWy_Q9CQEEWPhYp8wTJCYsQ&_nc_ohc=gNPsC79m_8sQ7kNvwGXlMW5&_nc_oc=AdlOGso6YAsLT5UzrPPdxJfQIwEszy7sMCeHcK6o7g-yH-mQyI8qkF8HETufIrIQO-U&_nc_zt=23&_nc_ht=scontent.fjal3-1.fna&_nc_gid=QcTfU3pRDS_5UNWTR09O_w&oh=00_AfFLbb6PP_fJIGz7lYBEbtOsEKqNahZ6DuoXXyToh_F_dw&oe=681CA91B'],
      type: 'website',
    },
    alternates: {
      canonical: CANONICAL_URL,
    }
  };
}

async function getPosts() {
  const result = await getMultiplePosts(1, 4);

  return { ...result, posts: mapPostsToCards(result.posts) };
}

export default async function Inicio() {
  const { posts, total } = await getPosts();

  return (
    <main className="">
      <h1 className="text-xl font-bold">
        Comida Justa: ¿Como evitar enfermedades, ahorrar tiempo y dinero, al
        mismo tiempo que apoyas al medio ambiente y a tu comunidad?
      </h1>

      <PostsWithLoadMore
        initialPosts={posts}
        totalPosts={total}
      />
    </main>
  );
}
