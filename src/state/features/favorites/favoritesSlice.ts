import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { PostForFavorites } from '~/types/Posts';
import { toggle } from '../notifications/notificationsSlice';

export const addFavoriteWithNotification = createAsyncThunk(
  'favorites/addFavoriteWithNotification',
  async (post: PostForFavorites, { dispatch }) => {
    dispatch(addFavorite(post));
    dispatch(toggle('add_favorite'));
    setTimeout(() => {
      // dispatch(toggle('add_favorite'));
    }, 3000);
  }
);

export const removeFavoriteWithNotification = createAsyncThunk(
  'favorites/removeFavoriteWithNotification',
  async (postId: string, { dispatch }) => {
    dispatch(removeFavorite(postId));
    dispatch(toggle('remove_favorite'));
  }
);

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: { items: [] as PostForFavorites[] },
  reducers: {
    addFavorite: (state, action: PayloadAction<PostForFavorites>) => {
      const exist = state.items.some(favorite => favorite.id === action.payload.id);
      if (!exist) {
        state.items.push(action.payload);
      }
    },
    removeFavorite: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    }
  }
});

export const { addFavorite, removeFavorite } = favoritesSlice.actions;
export default favoritesSlice.reducer;