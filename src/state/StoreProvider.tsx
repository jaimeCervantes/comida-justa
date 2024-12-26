'use client'
import { useRef, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore, RootState } from '~/state/store';

export default function StoreProvider({ children, initialState }: { children: ReactNode, initialState: RootState }) {
    const storeRef = useRef<AppStore>();
    
    if (!storeRef.current) {
        storeRef.current = makeStore(initialState);
    }

    return <Provider store={storeRef.current}>{children}</Provider>
}