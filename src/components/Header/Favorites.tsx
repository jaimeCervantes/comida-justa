'use client'
import Link from 'next/link'
import { useAppSelector } from '~/state/hooks'
import { RootState } from '~/state/store'


export default function Favorites() {
  const favorites = useAppSelector(state => state.favorites.items)
  return (
    favorites.length > 0 ? (
      <ul>|
          {favorites.map(favorite => (
              <li key={favorite.id}>
                  <Link href={`/${favorite.slug}`}>{favorite.title}</Link>
              </li>
          ))}
      </ul>
    ) : (<p>No tienes favoritos aún</p>)
  )           
}