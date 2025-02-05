import { configureStore } from '@reduxjs/toolkit';
import userReducer from './UserSlice.js';
import codeReducer from './CodeSlice.js';

export const store = configureStore({
    reducer: {
        user: userReducer,
        code: codeReducer,
    },
});