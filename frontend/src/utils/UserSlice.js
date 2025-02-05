import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    username: '',
    codeTitle: '',
    codeId: '',
    codeCreatedDate: '',
    codeUpdatedDate: '',
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    // reducer is a function which defines how a state is updated this all is reducer, like setUsername is a reducer function which changes the value of username according to action.payload
    reducers: {
        setUserId: (state, action) => {
            state.userId = action.payload;
        },
        setUsername: (state, action) => {
            state.username = action.payload;
        },
        setCodeTitle: (state, action) => {
            state.codeTitle = action.payload;
        },
        setCodeId: (state, action) => {
            state.codeId = action.payload;
        },
        setCodeCreatedDate: (state, action) => {
            state.codeCreatedDate = action.payload;
        },
        setCodeUpdatedDate: (state, action) => {
            state.codeUpdatedDate = action.payload;
        }
    }
})

//action is like dispatch(setUsername(username)) which will trigger the reducer function to change the state and put value in username variable

export const {
  setUsername,
  setCodeTitle,
  setCodeId,
  setCodeCreatedDate,
  setCodeUpdatedDate
} = userSlice.actions;
export default userSlice.reducer;