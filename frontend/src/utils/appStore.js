import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // Stores data in localStorage
import userReducer from './UserSlice.js';
import codeReducer from './CodeSlice.js';

const persistConfig = {
    key: 'root',
    storage,
};

// Persisting the store, data will stored in local storage, on refresh data will be there
const persistedUserReducer = persistReducer(persistConfig, userReducer);


export const store = configureStore({
  reducer: {
    user: persistedUserReducer,
    code: codeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"], // Ignore persist actions
      },
    }),
});

export const persistor = persistStore(store);