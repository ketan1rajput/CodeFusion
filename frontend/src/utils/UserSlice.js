import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userId: null,
  username: "",
  codeTitle: "",
  codeId: "",
  codeCreatedDate: "",
  codeUpdatedDate: "",
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserId: (state, action) => {
      return { ...state, userId: action.payload };
    },
    setUsername: (state, action) => {
      return { ...state, username: action.payload };
    },
    setCodeTitle: (state, action) => {
      return { ...state, codeTitle: action.payload };
    },
    setCodeId: (state, action) => {
      return { ...state, codeId: action.payload };
    },
    setCodeCreatedDate: (state, action) => {
      return { ...state, codeCreatedDate: action.payload };
    },
    setCodeUpdatedDate: (state, action) => {
      return { ...state, codeUpdatedDate: action.payload };
    },
  },
});

// Export actions
export const {
  setUserId,
  setUsername,
  setCodeTitle,
  setCodeId,
  setCodeCreatedDate,
  setCodeUpdatedDate,
} = userSlice.actions;

// Export reducer
export default userSlice.reducer;
