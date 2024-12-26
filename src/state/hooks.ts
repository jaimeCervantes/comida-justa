import { useDispatch, useSelector, useStore, TypedUseSelectorHook } from 'react-redux';
import { RootState, AppDispatch, AppStore } from './store';

// export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppDispatch = () => useDispatch<AppDispatch>();
// export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
// export const useAppStore = useStore.withTypes<AppStore>();
export const useAppStore = () => useStore<AppStore>();
