import { configureStore } from '@reduxjs/toolkit';
import favoritesReducer  from '~/state/features/favorites/favoritesSlice';
import notificationsReducer from '~/state/features/notifications/notificationsSlice';

export function makeStore(initialState: { favorites: ReturnType<typeof favoritesReducer> }) {
    return configureStore({
        reducer: {
            favorites: favoritesReducer,
            notifications: notificationsReducer
        },
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat([
            //more middlewares here
        ]),
        preloadedState: initialState
    });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"]