import { expect, test } from 'vitest';
import favoritesReducer, { addFavorite, removeFavorite } from './favoritesSlice';

const post1 = { id: '1', title: 'Post 1', slug: 'post-1' };
const post2 = { id: '2', title: 'Post 2', slug: 'post-2' };

test('should handle adding a favorite', () => {
    const initialState = { items: [] };
    const state = favoritesReducer(initialState, addFavorite(post1));
    expect(state.items).toEqual([post1]);
});

test('should not add duplicate favorites', () => {
    const initialState = { items: [post1] };
    const state = favoritesReducer(initialState, addFavorite(post1));
    expect(state.items).toEqual([post1]);
});

test('should handle removing a favorite', () => {
    const initialState = { items: [post1, post2] };
    const state = favoritesReducer(initialState, removeFavorite('1'));
    console.log(state.items);
    expect(state.items).toEqual([post2]);
});
