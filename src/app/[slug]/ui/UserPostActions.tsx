'use client'
import { useAppDispatch, useAppSelector } from '~/state/hooks'
import { AppDispatch, RootState } from '~/state/store'
import { addFavoriteWithNotification, removeFavoriteWithNotification } from '~/state/features/favorites/favoritesSlice'
import { PostForFavorites } from '~/types/Posts'
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai'

export default function UserPostActions({ post }: { post: PostForFavorites }) {
  const dispatch = useAppDispatch<AppDispatch>();
  const favorites = useAppSelector((state: RootState) => state.favorites);
  const isFavorite = favorites.items.some(favorite => favorite.id === post.id);

  function handleToggleFavorite() {
    if (isFavorite) {
      dispatch(removeFavoriteWithNotification(post.id));
    } else {
      dispatch(addFavoriteWithNotification(post));
    }
  }

  return (
    <div>
      <button 
      onClick={handleToggleFavorite} 
      className="bg-transparent text-red-500 p-2 rounded-full"
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      {isFavorite ? <AiFillHeart size={24} /> : <AiOutlineHeart size={24} />}
    </button>
    </div>
  );
}