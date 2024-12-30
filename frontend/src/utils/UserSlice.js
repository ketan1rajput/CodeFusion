import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    username: '',
    codeTitle: '',
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUsername: (state, action) => {
            state.username = action.payload;
        },
        setCodeTitle: (state, action) => {
            state.codeTitle = action.payload;
        }
    }
})

export const { setUsername, setCodeTitle } = userSlice.actions;
export default userSlice.reducer;